import { AuthenticatedCommand } from 'src/modules/shared/application/cqrs/authenticated-command';
import { MessageType } from '../../../domain/value-objects/message-type.vo';

export class CreateUserMessageCommand extends AuthenticatedCommand {
  constructor(
    public readonly message: string,
    public readonly type: MessageType,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
