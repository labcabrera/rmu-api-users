import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import type { UserApiResponse, UserSearchPort } from '../../ports/user-search.port';
import { SearchUsersQuery } from '../queries/search-users.query';

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery, Page<UserApiResponse>> {
  private readonly logger = new Logger(SearchUsersHandler.name);

  constructor(@Inject('UserSearchPort') private readonly userSearchPort: UserSearchPort) {}

  async execute(query: SearchUsersQuery): Promise<Page<UserApiResponse>> {
    this.logger.verbose(`Searching users with term ${query.term ?? ''}`);
    return this.userSearchPort.search(query.term, query.page, query.size);
  }
}
