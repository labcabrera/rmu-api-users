import { DeleteUserCommand } from '../../commands/delete-user.command';

export interface DeleteUserPort {
  execute(command: DeleteUserCommand): Promise<void>;
}
