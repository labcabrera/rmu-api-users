import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from '../queries/GetUserQuery';
import { User } from 'src/modules/user/domain/aggregates/user';
import type { UserRepository } from '../../ports/user-repository';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import type { UserSearchPort } from '../../ports/user-search.port';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery, User> {
  private readonly logger = new Logger(GetUserQueryHandler.name);

  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('UserSearchPort') private readonly userSearchPort: UserSearchPort,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    this.logger.verbose(`Getting user ${query.userId}`);
    const user = await this.userRepository.findById(query.userId);
    if (!user) throw new NotFoundError('User', query.userId);
    return user;
  }
}
