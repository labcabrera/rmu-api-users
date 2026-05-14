import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserMessage } from '../../../domain/aggregates/user-message';
import { UserMessageRepository } from '../../ports/user-message.repository';
import { CreateUserMessageCommand } from '../commands/create-user-message.command';
import { UserRepository } from 'src/modules/user/application/ports/user-repository';

@CommandHandler(CreateUserMessageCommand)
export class CreateUserMessageHandler implements ICommandHandler<CreateUserMessageCommand, UserMessage> {
  private readonly logger = new Logger(CreateUserMessageHandler.name);

  constructor(
    @Inject(UserMessageRepository) private readonly userMessageRepository: UserMessageRepository,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
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
