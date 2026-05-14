import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserMessage } from '../../../domain/aggregates/user-message';
import type { UserMessageRepository } from '../../ports/user-message.repository';
import { CreateUserMessageCommand } from '../commands/create-user-message.command';

@CommandHandler(CreateUserMessageCommand)
export class CreateUserMessageHandler implements ICommandHandler<CreateUserMessageCommand, UserMessage> {
  private readonly logger = new Logger(CreateUserMessageHandler.name);

  constructor(@Inject('UserMessageRepository') private readonly userMessageRepository: UserMessageRepository) {}

  async execute(command: CreateUserMessageCommand): Promise<UserMessage> {
    this.logger.verbose(`Creating ${command.type} message for user ${command.userId}`);
    const message = UserMessage.create({
      userId: command.userId,
      message: command.message,
      type: command.type,
    });
    return this.userMessageRepository.save(message);
  }
}
