import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { UserMessageGuard } from '../../../infrastructure/security/user-message.guard.js';
import { type UserMessageRepository, USER_MESSAGE_REPOSITORY } from '../../ports/user-message-repository.port.js';
import { MarkUserMessageReadCommand } from '../commands/mark-user-message-read.command.js';

@CommandHandler(MarkUserMessageReadCommand)
export class MarkUserMessageReadHandler implements ICommandHandler<MarkUserMessageReadCommand, UserMessage> {
  constructor(
    @Inject(USER_MESSAGE_REPOSITORY) private readonly userMessageRepository: UserMessageRepository,
    @Inject(UserMessageGuard) private readonly guard: UserMessageGuard,
  ) {}

  async execute(command: MarkUserMessageReadCommand): Promise<UserMessage> {
    const message = this.guard.checkRecipient(await this.userMessageRepository.findById(command.id), command.id, command.userId);
    message.markAsRead();
    if (!message.hasChanges()) return message;
    return this.userMessageRepository.update(message);
  }
}
