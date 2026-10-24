import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { type UserMessageRepository, USER_MESSAGE_REPOSITORY } from '../../ports/user-message-repository.port.js';
import { CreateUserMessageCommand } from '../commands/create-user-message.command.js';
import { type UserRepository, USER_REPOSITORY } from '../../../../user/application/ports/user-repository.port.js';

@CommandHandler(CreateUserMessageCommand)
export class CreateUserMessageHandler implements ICommandHandler<CreateUserMessageCommand, UserMessage> {
  private readonly logger = new Logger(CreateUserMessageHandler.name);

  constructor(
    @Inject(USER_MESSAGE_REPOSITORY) private readonly userMessageRepository: UserMessageRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CreateUserMessageCommand): Promise<UserMessage> {
    this.logger.verbose(`Creating ${command.type} message for user ${command.recipientId} from ${command.userId}`);
    const message = UserMessage.create({
      userId: command.recipientId,
      from: command.userId,
      message: command.message,
      type: command.type,
    });
    return this.userMessageRepository.save(message);
  }
}
