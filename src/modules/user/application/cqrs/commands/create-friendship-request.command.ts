import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';

export class CreateFriendshipRequestCommand extends AuthenticatedCommand {
  constructor(
    public addresseeId: string,
    public message: string | null,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
