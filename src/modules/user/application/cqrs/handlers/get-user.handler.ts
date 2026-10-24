import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '../../../domain/aggregates/user';
import { UserProvisioningService } from '../../services/user-provisioning.service';
import { GetUserQuery } from '../queries/get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, User> {
  constructor(@Inject(UserProvisioningService) private readonly provisioning: UserProvisioningService) {}

  execute(query: GetUserQuery): Promise<User> {
    return this.provisioning.provisionFromClaims(query.claims);
  }
}
