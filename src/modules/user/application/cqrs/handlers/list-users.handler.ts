import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import { RMU_ADMIN } from 'src/modules/shared/domain/entities/user-roles';
import { ForbiddenError } from 'src/modules/shared/domain/errors/errors';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserRepository } from '../../ports/user-repository';
import { GetUsersQuery } from '../queries/get-users-query';

/** Full profiles (with email) for administrators only. Everybody else uses SearchUsersQuery. */
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, Page<User>> {
  private readonly logger = new Logger(GetUsersHandler.name);

  constructor(@Inject(UserRepository) private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery): Promise<Page<User>> {
    if (!query.roles.includes(RMU_ADMIN)) {
      throw new ForbiddenError('You do not have permission to list users');
    }
    this.logger.verbose(`Listing users with query ${query.rsql ?? ''}`);
    return this.userRepository.findByRsql(query.rsql ?? '', query.page, query.size);
  }
}
