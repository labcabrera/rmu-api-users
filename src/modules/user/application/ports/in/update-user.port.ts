import { User } from '../../../domain/entities/user.entity';
import { UpdateUserCommand } from '../../commands/update-user.command';

export interface UpdateUserPort {
  execute(command: UpdateUserCommand): Promise<User>;
}
