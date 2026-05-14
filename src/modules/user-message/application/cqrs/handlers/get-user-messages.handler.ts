import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import { UserMessage } from '../../../domain/aggregates/user-message';
import { UserMessageRepository } from '../../ports/user-message.repository';
import { GetUserMessagesQuery } from '../queries/get-user-messages.query';

@QueryHandler(GetUserMessagesQuery)
export class GetUserMessagesHandler implements IQueryHandler<GetUserMessagesQuery, Page<UserMessage>> {
  constructor(@Inject(UserMessageRepository) private readonly userMessageRepository: UserMessageRepository) {}

  async execute(query: GetUserMessagesQuery): Promise<Page<UserMessage>> {
    return this.userMessageRepository.findByRsql(`recipientId==${query.userId};readed==null`, query.page, query.size);
  }
}
