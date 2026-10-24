import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command';

export class ActivateActivationCodeCommand extends AuthenticatedCommand {
  constructor(
    public readonly code: string,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
