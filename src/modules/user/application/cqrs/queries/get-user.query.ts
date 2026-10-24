import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import type { UserClaims } from '../../models/user-claims.js';

export class GetUserQuery extends AuthenticatedCommand {
  constructor(public readonly claims: UserClaims) {
    super(claims.id, claims.groups);
  }
}
