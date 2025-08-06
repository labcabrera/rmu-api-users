import { User } from '../../../domain/entities/user.entity';
import { CreateUserCommand } from '../../commands/create-user.command';

export interface CreateUserPort {
  execute(command: CreateUserCommand): Promise<User>;
}
