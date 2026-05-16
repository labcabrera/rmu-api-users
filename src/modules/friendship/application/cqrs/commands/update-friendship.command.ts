import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';
import { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo';

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
