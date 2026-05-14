import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';

export class GetUserQuery extends AuthenticatedCommand {
  constructor(userId: string, roles: string[]) {
    super(userId, roles);
  }
}
