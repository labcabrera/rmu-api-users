import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryCriteria } from '../../../../shared/application/criteria/query-criteria.js';
import { Page } from '../../../../shared/application/pagination/page.js';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { type UserMessageRepository, USER_MESSAGE_REPOSITORY } from '../../ports/user-message-repository.port.js';
import { GetUserMessagesQuery } from '../queries/get-user-messages.query.js';

@QueryHandler(GetUserMessagesQuery)
export class GetUserMessagesHandler implements IQueryHandler<GetUserMessagesQuery, Page<UserMessage>> {
  constructor(@Inject(USER_MESSAGE_REPOSITORY) private readonly userMessageRepository: UserMessageRepository) {}

  /**
   * The messages of the caller (its `userId`), filtered by `q` and newest first (F-users-08). The owner filter is a
   * QueryCriteria, never RSQL built from the id, so `q` cannot widen it. `q=readed==null` gives the unread ones.
   */
  async execute(query: GetUserMessagesQuery): Promise<Page<UserMessage>> {
    return this.userMessageRepository.findByRsql(query.rsql, query.page, query.size, QueryCriteria.eq('userId', query.userId), {
      createdAt: 'desc',
    });
  }
}
