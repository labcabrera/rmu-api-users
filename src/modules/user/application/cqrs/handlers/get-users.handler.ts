import { Inject, Logger } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '../../../../shared/application/pagination/page.js';
import { RMU_ADMIN } from '../../../../shared/domain/entities/user-roles.js';
import { ForbiddenError } from '../../../../shared/domain/errors/errors.js';
import { User } from '../../../domain/aggregates/user.js';
import { type UserRepository, USER_REPOSITORY } from '../../ports/user-repository.port.js';
import { GetUsersQuery } from '../queries/get-users.query.js';

/** Full profiles (with email) for administrators only. Everybody else uses SearchUsersQuery. */
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, Page<User>> {
  private readonly logger = new Logger(GetUsersHandler.name);

  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery): Promise<Page<User>> {
    if (!query.roles.includes(RMU_ADMIN)) {
      throw new ForbiddenError('You do not have permission to list users');
    }
    this.logger.verbose(`Listing users with query ${query.rsql ?? ''}`);
    return this.userRepository.findByRsql(query.rsql ?? '', query.page, query.size);
  }
}
