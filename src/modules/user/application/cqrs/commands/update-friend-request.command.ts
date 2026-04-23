import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';

export class UpdateFriendshipCommand extends AuthenticatedCommand {
  constructor(
    public addresseeId: string,
    public status: 'accepted' | 'rejected' | 'blocked',
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
