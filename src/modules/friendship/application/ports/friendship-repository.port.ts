import { Page } from '../../../shared/application/pagination/page';
import { QueryCriteria } from '../../../shared/application/criteria/query-criteria';
import { Friendship } from '../../domain/aggregates/friendship';

export interface FriendshipRepository {
  findById(id: string): Promise<Friendship | null>;
  findByParticipants(userId: string, friendId: string): Promise<Friendship | null>;
  findByRsql(rsql: string | undefined, page: number, size: number, filter?: QueryCriteria): Promise<Page<Friendship>>;
  save(friendship: Friendship): Promise<Friendship>;
  update(id: string, friendship: Partial<Friendship>): Promise<Friendship>;
  deleteById(id: string): Promise<Friendship | null>;
}

export const FRIENDSHIP_REPOSITORY = Symbol('FriendshipRepository');
