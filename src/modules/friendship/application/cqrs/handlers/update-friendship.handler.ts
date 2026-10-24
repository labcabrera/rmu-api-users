import { Inject } from '@nestjs/common';
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
  ) {}

  async execute(command: UpdateFriendshipCommand): Promise<Friendship> {
    const friendship = this.guard.checkUpdate(await this.friendshipRepository.findById(command.id), command.id, command.userId);
    friendship.checkVersion(command.expectedVersion);
    friendship.update({ status: command.status });
    if (!friendship.hasChanges()) return friendship;
    return this.friendshipRepository.update(friendship);
  }
}
