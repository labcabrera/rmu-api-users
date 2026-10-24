import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { sameState } from '../../../../shared/domain/aggregates/same-state.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { UpdateFriendshipCommand } from '../commands/update-friendship.command.js';

@CommandHandler(UpdateFriendshipCommand)
export class UpdateFriendshipHandler implements ICommandHandler<UpdateFriendshipCommand, Friendship> {
  constructor(@Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository) {}

  async execute(command: UpdateFriendshipCommand): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(command.id);
    if (!friendship) {
      throw new NotFoundError('Friendship', command.id);
    } else if (friendship.addresseeId !== command.userId) {
      throw new ForbiddenError('Only the addressee can accept or reject a friendship request');
    }
    friendship.checkVersion(command.expectedVersion);
    const before = friendship.getProps();
    friendship.update({ status: command.status });
    if (sameState(before, friendship.getProps())) return friendship;
    return this.friendshipRepository.update(friendship);
  }
}
