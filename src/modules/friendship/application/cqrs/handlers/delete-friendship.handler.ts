import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { FriendshipGuard } from '../../../infrastructure/security/friendship.guard.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { DeleteFriendshipCommand } from '../commands/delete-friendship.command.js';

@CommandHandler(DeleteFriendshipCommand)
export class DeleteFriendshipHandler implements ICommandHandler<DeleteFriendshipCommand, Friendship> {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
  ) {}

  async execute(command: DeleteFriendshipCommand): Promise<Friendship> {
    this.guard.checkDelete(await this.friendshipRepository.findById(command.id), command.id, command.userId);
    const deleted = await this.friendshipRepository.deleteById(command.id);
    if (!deleted) {
      throw new NotFoundError('Friendship', command.id);
    }
    return deleted;
  }
}
