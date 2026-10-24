import { AuthenticatedCommand } from '../../../../shared/application/cqrs/authenticated-command.js';
import type { MessageType } from '../../../domain/value-objects/message-type.vo.js';

export class CreateUserMessageCommand extends AuthenticatedCommand {
  constructor(
    public readonly message: string,
    public readonly type: MessageType,
    public readonly recipientId: string,
    userId: string,
    roles: string[],
  ) {
    super(userId, roles);
  }
}
