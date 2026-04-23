import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateFriendshipRequestCommand } from '../commands/create-friendship-request.command';
import { Friendship } from 'src/modules/user/domain/aggregates/friendship';
import type { FriendshipRepository } from '../../ports/friendship.repository';

@CommandHandler(CreateFriendshipRequestCommand)
export class CreateRealmHandler implements ICommandHandler<CreateFriendshipRequestCommand, Friendship> {
  private readonly logger = new Logger(CreateRealmHandler.name);

  constructor(@Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository) {}

  async execute(command: CreateFriendshipRequestCommand): Promise<Friendship> {
    this.logger.log(`Creating friendship ${command.addresseeId} for user ${command.userId}`);
    const friendship = Friendship.create({
      requesterId: command.userId,
      addresseeId: command.addresseeId,
      message: command.message,
    });
    await this.friendshipRepository.save(friendship);
    return friendship;
  }
}
