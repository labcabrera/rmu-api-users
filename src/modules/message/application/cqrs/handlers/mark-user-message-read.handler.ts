import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { UserMessage } from '../../../domain/aggregates/user-message';
import type { UserMessageRepository } from '../../ports/user-message.repository';
import { MarkUserMessageReadCommand } from '../commands/mark-user-message-read.command';

@CommandHandler(MarkUserMessageReadCommand)
export class MarkUserMessageReadHandler implements ICommandHandler<MarkUserMessageReadCommand, UserMessage> {
  constructor(@Inject('UserMessageRepository') private readonly userMessageRepository: UserMessageRepository) {}

  async execute(command: MarkUserMessageReadCommand): Promise<UserMessage> {
    const message = await this.userMessageRepository.findById(command.id);
    if (!message || message.userId !== command.userId) {
      throw new NotFoundError('UserMessage', command.id);
    }
    message.markAsRead();
    return this.userMessageRepository.update(message.id, message);
  }
}
