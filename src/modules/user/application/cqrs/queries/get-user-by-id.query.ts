import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';

/** One full profile by id, for administrators. */
export class GetUserByIdQuery extends AuthenticatedCommand {
  constructor(
    public readonly id: string,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
