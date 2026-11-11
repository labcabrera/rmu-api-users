import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';

export class CreateFriendshipRequestCommand extends AuthenticatedCommand {
  constructor(
    public addresseeName: string,
    public message: string | null,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
