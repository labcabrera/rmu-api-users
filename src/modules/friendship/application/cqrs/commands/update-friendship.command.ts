import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo.js';

export class UpdateFriendshipCommand extends AuthenticatedCommand {
  constructor(
    public id: string,
    public status: FriendshipStatus | undefined,
    userId: string,
    roles: string[],
    /** Version the client read; a different stored version is a ConflictError (`version-conflict`). */
    public expectedVersion?: number,
  ) {
    super(userId, roles);
  }
}
