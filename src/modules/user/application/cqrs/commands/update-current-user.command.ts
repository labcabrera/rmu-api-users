import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';

export class UpdateCurrentUserCommand extends AuthenticatedCommand {
  constructor(
    public readonly name: string | undefined,
    public readonly settings: UserSettings | undefined,
    public readonly imageUrl: string | null | undefined,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
