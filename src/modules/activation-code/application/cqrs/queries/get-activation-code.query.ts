import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';

export class GetActivationCodeQuery extends AuthenticatedCommand {
  constructor(
    public readonly id: string,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
