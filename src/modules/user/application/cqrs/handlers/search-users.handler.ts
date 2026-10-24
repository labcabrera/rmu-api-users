import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '../../../../shared/application/pagination/page.js';
import type { UserSummary } from '../../models/user-summary.js';
import { type UserRepository, USER_REPOSITORY } from '../../ports/user-repository.port.js';
import { SearchUsersQuery } from '../queries/search-users.query.js';

export const SEARCH_USERS_MAX_SIZE = 20;

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery, Page<UserSummary>> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  execute(query: SearchUsersQuery): Promise<Page<UserSummary>> {
    const size = Math.min(Math.max(1, query.size), SEARCH_USERS_MAX_SIZE);
    const page = Math.max(0, query.page);
    return this.userRepository.searchByNamePrefix(query.name.trim(), page, size);
  }
}
