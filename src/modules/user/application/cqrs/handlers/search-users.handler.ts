import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import { GetUsersQuery } from '../queries/get-users-query';
import { UserRepository } from '../../ports/user-repository';
import { User } from 'src/modules/user/domain/aggregates/user';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, Page<User>> {
  private readonly logger = new Logger(GetUsersHandler.name);

  constructor(@Inject(UserRepository) private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery): Promise<Page<User>> {
    this.logger.verbose(`Searching users with term ${query.rsql ?? ''}`);
    return await this.userRepository.findByRsql(query.rsql ?? '', query.page, query.size);
  }
}
