import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';

export class SearchUsersQuery extends AuthenticatedCommand {
  constructor(
    public readonly name: string,
    public readonly page: number,
    public readonly size: number,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
