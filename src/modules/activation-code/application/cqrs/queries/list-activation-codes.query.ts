import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';

export class ListActivationCodesQuery extends AuthenticatedCommand {
  constructor(
    public readonly q: string | undefined,
    public readonly page: number,
    public readonly size: number,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
