import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { Friendship } from '../../../domain/aggregates/friendship';
import type { FriendshipRepository } from '../../ports/friendship.repository';
import { DeleteFriendshipCommand } from '../commands/delete-friendship.command';

@CommandHandler(DeleteFriendshipCommand)
export class DeleteFriendshipHandler implements ICommandHandler<DeleteFriendshipCommand, Friendship> {
  constructor(@Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository) {}

  async execute(command: DeleteFriendshipCommand): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(command.id);
    if (!friendship || !friendship.hasParticipant(command.userId)) {
      throw new NotFoundError('Friendship', command.id);
    }
    const deleted = await this.friendshipRepository.deleteById(command.id);
    if (!deleted) {
      throw new NotFoundError('Friendship', command.id);
    }
    return deleted;
  }
}
