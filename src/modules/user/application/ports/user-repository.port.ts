import type { BaseRepository } from '../../../shared/application/ports/base-repository.port.js';
import { User } from '../../domain/aggregates/user.js';
import { QueryCriteria, type SortCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { Page } from '../../../shared/application/pagination/page.js';
import type { UserSummary } from '../models/user-summary.js';

export interface UserRepository extends BaseRepository<User> {
  findById(id: string): Promise<User | null>;
  /** Exact, case-insensitive lookup by display name. */
  findByName(name: string): Promise<User | null>;
  /** True when another profile (other than `excludeId`) already uses the display name (case-insensitive). */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  /** Case-insensitive prefix search by display name, returning the public projection only. */
  searchByNamePrefix(prefix: string, page: number, size: number): Promise<Page<UserSummary>>;
  findByRsql(rsql: string | undefined, page: number, size: number, filter?: QueryCriteria, sort?: SortCriteria): Promise<Page<User>>;
  /** Throws ConflictError when the id or the display name already exists. */
  save(entity: User): Promise<User>;
  /**
   * Throws ConflictError when the display name already exists, or (`version-conflict`) when the profile changed since it
   * was loaded. It never writes `lastLoginAt`, which only updateLastLoginAt writes (F-users-27).
   */
  update(entity: User): Promise<User>;
  /** Writes `lastLoginAt` only (no other field, no `updatedAt`, no version: a login is not a change of the profile). */
  updateLastLoginAt(id: string, at: Date): Promise<void>;
  deleteById(id: string): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
