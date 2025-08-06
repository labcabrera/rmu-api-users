import { User } from '../../../domain/entities/user.entity';

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findAll(query: any, page: number, size: number): Promise<User[]>;
  save(user: Partial<User>): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  deleteById(id: string): Promise<void>;
}
