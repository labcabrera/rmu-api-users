import { BaseRepository } from '../../../shared/application/ports/base-repository.port';
import { User } from '../../domain/aggregates/user';
import { QueryCriteria, SortCriteria } from '../../../shared/application/criteria/query-criteria';
import { Page } from '../../../shared/application/pagination/page';
import { UserSummary } from '../models/user-summary';

export abstract class UserRepository implements BaseRepository<User> {
  abstract findById(id: string): Promise<User | null>;
  /** Exact, case-insensitive lookup by display name. */
  abstract findByName(name: string): Promise<User | null>;
  /** True when another profile (other than `excludeId`) already uses the display name (case-insensitive). */
  abstract existsByName(name: string, excludeId?: string): Promise<boolean>;
  /** Case-insensitive prefix search by display name, returning the public projection only. */
  abstract searchByNamePrefix(prefix: string, page: number, size: number): Promise<Page<UserSummary>>;
  abstract findByRsql(
    rsql: string | undefined,
    page: number,
    size: number,
    filter?: QueryCriteria,
    sort?: SortCriteria,
  ): Promise<Page<User>>;
  /** Throws ConflictError when the id or the display name already exists. */
  abstract save(entity: Partial<User>): Promise<User>;
  /** Throws ConflictError when the display name already exists. */
  abstract update(id: string, entity: Partial<User>): Promise<User>;
  /** Writes `lastLoginAt` only (no other field, no `updatedAt`). */
  abstract updateLastLoginAt(id: string, at: Date): Promise<void>;
  abstract deleteById(id: string): Promise<User | null>;
}
