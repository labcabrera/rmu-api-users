import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DOMAIN_EVENT_PUBLISHER, type DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher.port.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { type UserRepository, USER_REPOSITORY } from '../../../../user/application/ports/user-repository.port.js';
import { FriendInvite, hashInviteToken, MAX_ACTIVE_FRIEND_INVITES } from '../../../domain/aggregates/friend-invite.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { FriendshipUpdatedEvent } from '../../../domain/events/friendship-events.js';
import { FriendshipGuard } from '../../../infrastructure/security/friendship.guard.js';
import { type FriendInviteRepository, FRIEND_INVITE_REPOSITORY } from '../../ports/friend-invite-repository.port.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { AcceptFriendInviteCommand, CreateFriendInviteCommand, DeleteFriendInviteCommand } from '../commands/friend-invite.commands.js';
import { CheckFriendInviteQuery, ListFriendInvitesQuery } from '../queries/friend-invite.queries.js';

/** Unknown, expired and used invites look the same (spec 070, decision 5). */
const invalidInvite = () => new NotFoundError('Friend invite', 'token', 'friend-invite-invalid');

/** A new invite and the token to hand to its inviter: the only time the token is seen. */
export type CreatedFriendInvite = { invite: FriendInvite; token: string };

@CommandHandler(CreateFriendInviteCommand)
export class CreateFriendInviteHandler implements ICommandHandler<CreateFriendInviteCommand, CreatedFriendInvite> {
  constructor(
    @Inject(FRIEND_INVITE_REPOSITORY) private readonly invites: FriendInviteRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
  ) {}

  async execute(command: CreateFriendInviteCommand): Promise<CreatedFriendInvite> {
    this.guard.checkCreate(command.roles);
    const inviter = await this.users.findById(command.userId);
    if (!inviter) throw new ValidationError('Inviter user not found');
    const now = new Date();
    if ((await this.invites.countActiveByInviter(inviter.id, now)) >= MAX_ACTIVE_FRIEND_INVITES) {
      throw new ConflictError(`At most ${MAX_ACTIVE_FRIEND_INVITES} active invites`, 'friend-invite-limit');
    }
    const created = FriendInvite.create({ id: inviter.id, name: inviter.name }, now);
    await this.invites.save(created.invite);
    return created;
  }
}

@CommandHandler(DeleteFriendInviteCommand)
export class DeleteFriendInviteHandler implements ICommandHandler<DeleteFriendInviteCommand, void> {
  constructor(@Inject(FRIEND_INVITE_REPOSITORY) private readonly invites: FriendInviteRepository) {}

  async execute(command: DeleteFriendInviteCommand): Promise<void> {
    const invite = await this.invites.findById(command.id);
    // Somebody else's invite does not exist for the caller, admins included (as friendships, F-users-18).
    if (!invite || invite.inviterId !== command.userId) throw new NotFoundError('Friend invite', command.id);
    await this.invites.deleteById(invite.id);
  }
}

/**
 * Makes the inviter and the caller friends (spec 070, decision 5). The invite is consumed only when the friendship is
 * made: with oneself, with a friend already or with a block it stays usable.
 */
@CommandHandler(AcceptFriendInviteCommand)
export class AcceptFriendInviteHandler implements ICommandHandler<AcceptFriendInviteCommand, Friendship> {
  constructor(
    @Inject(FRIEND_INVITE_REPOSITORY) private readonly invites: FriendInviteRepository,
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendships: FriendshipRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: AcceptFriendInviteCommand): Promise<Friendship> {
    this.guard.checkCreate(command.roles);
    const now = new Date();
    const invite = await this.invites.findActiveByTokenHash(hashInviteToken(command.token), now);
    if (!invite) throw invalidInvite();
    const invitee = await this.users.findById(command.userId);
    if (!invitee) throw new ValidationError('Invitee user not found');
    const inviter = { id: invite.inviterId, name: invite.inviterName };
    const self = { id: invitee.id, name: invitee.name };

    const current = await this.friendships.findByParticipants(inviter.id, invitee.id);
    // Checks before consuming: these throw and leave the invite as it was.
    const friendship = current ?? Friendship.fromInvite(inviter, self);
    if (current) current.acceptInvite(inviter, self);

    if (!(await this.invites.consume(invite.id, now))) throw invalidInvite();
    if (!current) return this.friendships.save(friendship);
    const updated = await this.friendships.update(friendship);
    await this.events.publish('friendship', new FriendshipUpdatedEvent(updated.getProps()));
    return updated;
  }
}

@QueryHandler(ListFriendInvitesQuery)
export class ListFriendInvitesHandler implements IQueryHandler<ListFriendInvitesQuery, FriendInvite[]> {
  constructor(@Inject(FRIEND_INVITE_REPOSITORY) private readonly invites: FriendInviteRepository) {}

  execute(query: ListFriendInvitesQuery): Promise<FriendInvite[]> {
    return this.invites.findActiveByInviter(query.userId, new Date());
  }
}

/** Who invites, for the page that opens the link. Any signed-in user may ask: knowing the token is the permission. */
@QueryHandler(CheckFriendInviteQuery)
export class CheckFriendInviteHandler implements IQueryHandler<CheckFriendInviteQuery, FriendInvite> {
  constructor(@Inject(FRIEND_INVITE_REPOSITORY) private readonly invites: FriendInviteRepository) {}

  async execute(query: CheckFriendInviteQuery): Promise<FriendInvite> {
    const invite = await this.invites.findActiveByTokenHash(hashInviteToken(query.token), new Date());
    if (!invite) throw invalidInvite();
    return invite;
  }
}
