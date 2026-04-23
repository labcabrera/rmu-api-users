import { BaseRepository } from 'src/modules/shared/application/ports/base-repository';
import { User } from '../../domain/aggregates/user';

export type UserRepository = BaseRepository<User>;
