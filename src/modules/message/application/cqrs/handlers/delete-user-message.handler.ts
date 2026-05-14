import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { UserMessage } from '../../../domain/aggregates/user-message';
import type { UserMessageRepository } from '../../ports/user-message.repository';
import { DeleteUserMessageCommand } from '../commands/delete-user-message.command';

@CommandHandler(DeleteUserMessageCommand)
export class DeleteUserMessageHandler implements ICommandHandler<DeleteUserMessageCommand, UserMessage> {
  constructor(@Inject('UserMessageRepository') private readonly userMessageRepository: UserMessageRepository) {}

  async execute(command: DeleteUserMessageCommand): Promise<UserMessage> {
    const message = await this.userMessageRepository.findById(command.id);
    if (!message || message.userId !== command.userId) {
      throw new NotFoundError('UserMessage', command.id);
    }
    const deleted = await this.userMessageRepository.deleteById(command.id);
    if (!deleted) {
      throw new NotFoundError('UserMessage', command.id);
    }
    return deleted;
  }
}
