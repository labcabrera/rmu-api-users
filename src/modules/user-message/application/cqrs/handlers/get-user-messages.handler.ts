import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '../../../../shared/application/pagination/page.js';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { type UserMessageRepository, USER_MESSAGE_REPOSITORY } from '../../ports/user-message-repository.port.js';
import { GetUserMessagesQuery } from '../queries/get-user-messages.query.js';

@QueryHandler(GetUserMessagesQuery)
export class GetUserMessagesHandler implements IQueryHandler<GetUserMessagesQuery, Page<UserMessage>> {
  constructor(@Inject(USER_MESSAGE_REPOSITORY) private readonly userMessageRepository: UserMessageRepository) {}

  async execute(query: GetUserMessagesQuery): Promise<Page<UserMessage>> {
    return this.userMessageRepository.findByRsql(`recipientId==${query.userId};readed==null`, query.page, query.size);
  }
}
