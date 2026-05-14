import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateFriendshipRequestCommand } from '../commands/create-friendship-request.command';
import { ConflictError } from 'src/modules/shared/domain/errors/errors';
import { Friendship } from '../../../domain/aggregates/friendship';
import type { FriendshipRepository } from '../../ports/friendship.repository';

@CommandHandler(CreateFriendshipRequestCommand)
export class CreateFriendshipRequestHandler implements ICommandHandler<CreateFriendshipRequestCommand, Friendship> {
  private readonly logger = new Logger(CreateFriendshipRequestHandler.name);

  constructor(@Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository) {}

  async execute(command: CreateFriendshipRequestCommand): Promise<Friendship> {
    this.logger.log(`Creating friendship ${command.addresseeName} for user ${command.userId}`);
    const existing = await this.friendshipRepository.findByParticipants(command.userId, command.addresseeName);
    if (existing && existing.status !== 'rejected') {
      throw new ConflictError('Friendship already exists between users');
    }
    const friendship = Friendship.create({
      requesterId: command.userId,
      addresseeName: command.addresseeName,
      message: command.message,
    });
    await this.friendshipRepository.save(friendship);
    return friendship;
  }
}
