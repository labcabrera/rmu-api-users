import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import { UserSettings } from '../../../domain/value-objects/user-settings.vo.js';

export class UpdateCurrentUserCommand extends AuthenticatedCommand {
  constructor(
    public readonly name: string | undefined,
    public readonly settings: UserSettings | undefined,
    public readonly imageUrl: string | null | undefined,
    userId: string,
    roles: string[],
    /** Version the client read; a different stored version is a ConflictError (`version-conflict`). */
    public readonly expectedVersion?: number,
  ) {
    super(userId, roles);
  }
}
