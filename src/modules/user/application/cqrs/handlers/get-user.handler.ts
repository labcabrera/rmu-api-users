import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '../../../domain/aggregates/user.js';
import { UserProvisioningService } from '../../services/user-provisioning.service.js';
import { GetUserQuery } from '../queries/get-user.query.js';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, User> {
  constructor(@Inject(UserProvisioningService) private readonly provisioning: UserProvisioningService) {}

  execute(query: GetUserQuery): Promise<User> {
    return this.provisioning.provisionFromClaims(query.claims);
  }
}
