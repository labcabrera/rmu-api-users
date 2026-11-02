import { Page } from '../../../shared/application/pagination/page.js';
import { QueryCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { Friendship } from '../../domain/aggregates/friendship.js';

export interface FriendshipRepository {
  findById(id: string): Promise<Friendship | null>;
  findByParticipants(userId: string, friendId: string): Promise<Friendship | null>;
  findByRsql(rsql: string | undefined, page: number, size: number, filter?: QueryCriteria): Promise<Page<Friendship>>;
  /** Requests sent by the user since the date, created or reopened (spec 070, decision 3). */
  countRequestedSince(requesterId: string, since: Date): Promise<number>;
  save(friendship: Friendship): Promise<Friendship>;
  /** Throws ConflictError (`version-conflict`) when the friendship changed since it was loaded. */
  update(friendship: Friendship): Promise<Friendship>;
  deleteById(id: string): Promise<Friendship | null>;
}

export const FRIENDSHIP_REPOSITORY = Symbol('FriendshipRepository');
