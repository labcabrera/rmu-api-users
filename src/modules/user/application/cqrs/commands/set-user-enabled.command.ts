import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';

/** Enables or disables an account (administrators only). */
export class SetUserEnabledCommand extends AuthenticatedCommand {
  constructor(
    public readonly id: string,
    public readonly enabled: boolean,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
