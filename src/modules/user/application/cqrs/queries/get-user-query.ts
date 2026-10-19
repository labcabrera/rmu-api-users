import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';
import { UserClaims } from '../../models/user-claims';

export class GetUserQuery extends AuthenticatedCommand {
  constructor(public readonly claims: UserClaims) {
    super(claims.id, claims.groups);
  }
}
