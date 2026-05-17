import { BaseRepository } from 'src/modules/shared/application/ports/base-repository';
import { User } from '../../domain/aggregates/user';
import { QueryCriteria, SortCriteria } from 'src/modules/shared/application/criteria/query-criteria';
import { Page } from 'src/modules/shared/domain/entities/page';

export abstract class UserRepository implements BaseRepository<User> {
  abstract findById(id: string): Promise<User | null>;
  abstract findByName(string: string): Promise<User | null>;
  abstract findByRsql(
    rsql: string | undefined,
    page: number,
    size: number,
    filter?: QueryCriteria,
    sort?: SortCriteria,
  ): Promise<Page<User>>;
  abstract save(entity: Partial<User>): Promise<User>;
  abstract update(id: string, entity: Partial<User>): Promise<User>;
  abstract deleteById(id: string): Promise<User | null>;
}
