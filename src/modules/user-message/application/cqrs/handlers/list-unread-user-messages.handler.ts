import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import { UserMessage } from '../../../domain/aggregates/user-message';
import { UserMessageRepository } from '../../ports/user-message.repository';
import { ListUnreadUserMessagesQuery } from '../queries/list-unread-user-messages.query';

@QueryHandler(ListUnreadUserMessagesQuery)
export class ListUnreadUserMessagesHandler implements IQueryHandler<ListUnreadUserMessagesQuery, Page<UserMessage>> {
  constructor(@Inject(UserMessageRepository) private readonly userMessageRepository: UserMessageRepository) {}

  async execute(query: ListUnreadUserMessagesQuery): Promise<Page<UserMessage>> {
    return this.userMessageRepository.findUnreadByUser(query.userId, query.page, query.size);
  }
}
