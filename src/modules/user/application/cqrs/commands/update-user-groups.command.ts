import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import type { ManagedGroup } from '../../../../shared/domain/entities/user-roles.js';

/** Sets which of the managed realm groups a user belongs to (administrators only). */
export class UpdateUserGroupsCommand extends AuthenticatedCommand {
  constructor(
    public readonly id: string,
    public readonly groups: ManagedGroup[],
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
