import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '../../../../shared/application/pagination/page';
import { UserSummary } from '../../models/user-summary';
import { UserRepository } from '../../ports/user-repository.port';
import { SearchUsersQuery } from '../queries/search-users.query';

export const SEARCH_USERS_MAX_SIZE = 20;

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery, Page<UserSummary>> {
  constructor(@Inject(UserRepository) private readonly userRepository: UserRepository) {}

  execute(query: SearchUsersQuery): Promise<Page<UserSummary>> {
    const size = Math.min(Math.max(1, query.size), SEARCH_USERS_MAX_SIZE);
    const page = Math.max(0, query.page);
    return this.userRepository.searchByNamePrefix(query.name.trim(), page, size);
  }
}
