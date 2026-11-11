import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CreateFriendshipRequestCommand } from '../commands/create-friendship-request.command.js';
import { ConflictError, TooManyRequestsError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { type UserRepository, USER_REPOSITORY } from '../../../../user/application/ports/user-repository.port.js';
import { FriendshipGuard } from '../../../infrastructure/security/friendship.guard.js';

/** Requests a user may send in a rolling day (spec 070, decision 3). */
export const MAX_FRIEND_REQUESTS_PER_DAY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A friend request goes to an RMU profile found by its exact display name, case-insensitive (spec 070, decision 1).
 * Neither the Keycloak username nor the email find anybody, so the answer never tells whether an email is registered.
 */
@CommandHandler(CreateFriendshipRequestCommand)
export class CreateFriendshipRequestHandler implements ICommandHandler<CreateFriendshipRequestCommand, Friendship> {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
  ) {}

  async execute(command: CreateFriendshipRequestCommand): Promise<Friendship> {
    this.guard.checkCreate(command.roles);
    const requester = await this.userRepository.findById(command.userId);
    if (!requester) {
      throw new ValidationError('Requester user not found');
    }
    const addressee = await this.userRepository.findByName(command.addresseeName.trim());
    if (!addressee || !addressee.enabled) {
      throw new ValidationError('Addressee user not found', 'addressee-not-found');
    } else if (requester.id === addressee.id) {
      throw new ValidationError('Requester and addressee must be different users', 'friendship-self');
    }
    const sent = await this.friendshipRepository.countRequestedSince(requester.id, new Date(Date.now() - DAY_MS));
    if (sent >= MAX_FRIEND_REQUESTS_PER_DAY) {
      throw new TooManyRequestsError(`At most ${MAX_FRIEND_REQUESTS_PER_DAY} friend requests a day`, 'friend-request-limit');
    }

    const current = await this.friendshipRepository.findByParticipants(command.userId, addressee.id);
    if (current) {
      switch (current.status) {
        case 'pending':
          throw new ConflictError('Friendship request already pending between users', 'friendship-pending');
        case 'accepted':
          throw new ConflictError('Users are already friends', 'already-friends');
        case 'blocked':
          throw new ConflictError('Friendship is blocked', 'friendship-blocked');
        case 'rejected':
          // F-users-17: a new request after a rejection reopens it, in the direction of the new request.
          current.reopen({ id: requester.id, name: requester.name }, { id: addressee.id, name: addressee.name }, command.message);
          return this.friendshipRepository.update(current);
      }
    }
    const friendship = Friendship.create({
      requesterId: command.userId,
      requesterName: requester.name,
      addresseeId: addressee.id,
      addresseeName: addressee.name,
      message: command.message,
    });
    await this.friendshipRepository.save(friendship);
    return friendship;
  }
}
