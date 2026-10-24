import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { UserMessageRepository } from '../../ports/user-message-repository.port.js';
import { MarkUserMessageReadCommand } from '../commands/mark-user-message-read.command.js';

@CommandHandler(MarkUserMessageReadCommand)
export class MarkUserMessageReadHandler implements ICommandHandler<MarkUserMessageReadCommand, UserMessage> {
  constructor(@Inject(UserMessageRepository) private readonly userMessageRepository: UserMessageRepository) {}

  async execute(command: MarkUserMessageReadCommand): Promise<UserMessage> {
    const message = await this.userMessageRepository.findById(command.id);
    if (!message || message.userId !== command.userId) {
      throw new NotFoundError('UserMessage', command.id);
    }
    message.markAsRead();
    return this.userMessageRepository.update(message.id, message);
  }
}
