import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo.js';

export class UpdateFriendshipCommand extends AuthenticatedCommand {
  constructor(
    public id: string,
    public status: FriendshipStatus | undefined,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
