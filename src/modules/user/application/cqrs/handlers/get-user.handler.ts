import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from '../queries/GetUserQuery';
import { User } from 'src/modules/user/domain/aggregates/user';
import type { UserRepository } from '../../ports/user-repository';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import type { UserApiResponse, UserSearchPort } from '../../ports/user-search.port';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, User> {
  private readonly logger = new Logger(GetUserHandler.name);

  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('UserSearchPort') private readonly userSearchPort: UserSearchPort,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    this.logger.verbose(`Getting user ${query.userId}`);
    const keycloakUser = await this.userSearchPort.findById(query.userId);
    if (!keycloakUser) {
      this.logger.warn(`User ${query.userId} not found in Keycloak`);
      throw new NotFoundError('User', query.userId);
    }
    let user = await this.userRepository.findById(query.userId);
    if (user) {
      this.mergeUser(user, keycloakUser);
      await this.userRepository.save(user);
    } else {
      user = this.createUserFromKeycloak(keycloakUser);
      await this.userRepository.update(user.id, user);
    }
    return user;
  }

  private mergeUser(user: User, keycloakUser: UserApiResponse): User {
    // TODO
    throw new Error('Not implemented');
  }

  private createUserFromKeycloak(keycloakUser: UserApiResponse): User {
    // TODO
    throw new Error('Not implemented');
  }
}
