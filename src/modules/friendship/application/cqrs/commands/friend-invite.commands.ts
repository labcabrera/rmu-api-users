import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';

export class CreateFriendInviteCommand extends AuthenticatedCommand {}

export class DeleteFriendInviteCommand extends AuthenticatedCommand {
  constructor(
    public readonly id: string,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}

export class AcceptFriendInviteCommand extends AuthenticatedCommand {
  constructor(
    public readonly token: string,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
