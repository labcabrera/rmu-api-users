import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';

export class UpdateUserSettingsCommand extends AuthenticatedCommand {
  constructor(
    public measurementSystem: 'metric' | 'imperial',
    public defaultRealm: string,
    public language: string,
    public theme: 'light' | 'dark',
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
