import { Inject } from '@nestjs/common';
import { DOMAIN_EVENT_PUBLISHER, type DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher.port.js';
import { FriendshipUpdatedEvent } from '../../../domain/events/friendship-events.js';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { FriendshipGuard } from '../../../infrastructure/security/friendship.guard.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { UpdateFriendshipCommand } from '../commands/update-friendship.command.js';

@CommandHandler(UpdateFriendshipCommand)
export class UpdateFriendshipHandler implements ICommandHandler<UpdateFriendshipCommand, Friendship> {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: UpdateFriendshipCommand): Promise<Friendship> {
    const friendship = this.guard.checkUpdate(
      await this.friendshipRepository.findById(command.id),
      command.id,
      command.userId,
      command.status,
    );
    friendship.checkVersion(command.expectedVersion);
    friendship.update({ status: command.status }, command.userId);
    if (!friendship.hasChanges()) return friendship;
    const updated = await this.friendshipRepository.update(friendship);
    // Core reads it to remove the realm shares of a blocked friendship (spec 069).
    await this.events.publish('friendship', new FriendshipUpdatedEvent(updated.getProps()));
    return updated;
  }
}
