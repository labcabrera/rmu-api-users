import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';

export class FriendshipRequestCommand extends AuthenticatedCommand {
  constructor(
    public addresseeEmail: string,
    public message: string | null,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
