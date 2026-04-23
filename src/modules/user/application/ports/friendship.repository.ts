import { Page } from 'src/modules/shared/domain/entities/page';
import { Friendship } from 'src/modules/user/domain/aggregates/friendship';

export interface FriendshipRepository {
  findById(id: string): Promise<Friendship | null>;
  findByRsql(rsql: string, page: number, size: number): Promise<Page<Friendship>>;
  save(friendship: Partial<Friendship>): Promise<Friendship>;
  update(id: string, friendship: Partial<Friendship>): Promise<Friendship>;
  deleteById(id: string): Promise<Friendship | null>;
}
