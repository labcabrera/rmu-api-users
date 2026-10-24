import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../../../friendship/application/ports/friendship-repository.port.js';
import { type UserRepository, USER_REPOSITORY } from '../../../../user/application/ports/user-repository.port.js';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { UserMessageGuard } from '../../../infrastructure/security/user-message.guard.js';
import { type UserMessageRepository, USER_MESSAGE_REPOSITORY } from '../../ports/user-message-repository.port.js';
import { CreateUserMessageCommand } from '../commands/create-user-message.command.js';

/** Sends a message to a user that exists and is an accepted friend of the sender (F-users-09). */
@CommandHandler(CreateUserMessageCommand)
export class CreateUserMessageHandler implements ICommandHandler<CreateUserMessageCommand, UserMessage> {
  private readonly logger = new Logger(CreateUserMessageHandler.name);

  constructor(
    @Inject(USER_MESSAGE_REPOSITORY) private readonly userMessageRepository: UserMessageRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(UserMessageGuard) private readonly guard: UserMessageGuard,
  ) {}

  async execute(command: CreateUserMessageCommand): Promise<UserMessage> {
    this.guard.checkCreate(command.roles);
    const recipient = await this.userRepository.findById(command.recipientId);
    if (!recipient) throw new NotFoundError('User', command.recipientId);
    this.guard.checkFriendship(
      await this.friendshipRepository.findByParticipants(command.userId, recipient.id),
      command.userId,
      command.roles,
    );
    this.logger.verbose(`Creating ${command.type} message for user ${recipient.id} from ${command.userId}`);
    const message = UserMessage.create({
      userId: recipient.id,
      from: command.userId,
      message: command.message,
      type: command.type,
    });
    return this.userMessageRepository.save(message);
  }
}
