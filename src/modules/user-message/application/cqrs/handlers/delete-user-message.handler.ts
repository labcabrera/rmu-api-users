import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { type UserMessageRepository, USER_MESSAGE_REPOSITORY } from '../../ports/user-message-repository.port.js';
import { DeleteUserMessageCommand } from '../commands/delete-user-message.command.js';

@CommandHandler(DeleteUserMessageCommand)
export class DeleteUserMessageHandler implements ICommandHandler<DeleteUserMessageCommand, UserMessage> {
  constructor(@Inject(USER_MESSAGE_REPOSITORY) private readonly userMessageRepository: UserMessageRepository) {}

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
