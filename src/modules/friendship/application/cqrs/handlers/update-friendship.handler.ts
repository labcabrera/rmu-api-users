import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { Friendship } from '../../../domain/aggregates/friendship';
import type { FriendshipRepository } from '../../ports/friendship.repository';
import { UpdateFriendshipCommand } from '../commands/update-friendship.command';

@CommandHandler(UpdateFriendshipCommand)
export class UpdateFriendshipHandler implements ICommandHandler<UpdateFriendshipCommand, Friendship> {
  constructor(@Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository) {}

  async execute(command: UpdateFriendshipCommand): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(command.id);
    if (!friendship || !friendship.hasParticipant(command.userId)) {
      throw new NotFoundError('Friendship', command.id);
    }
    if ((command.status === 'accepted' || command.status === 'rejected') && friendship.addresseeId !== command.userId) {
      throw new ForbiddenError('Only the addressee can accept or reject a friendship request');
    }
    friendship.update({ status: command.status, message: command.message });
    return this.friendshipRepository.update(friendship.id, friendship);
  }
}
