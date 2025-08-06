import { Friendship } from 'src/modules/user/domain/entities/friendship.entity';
import { Page } from 'src/modules/user/domain/entities/page';

export interface FriendshipRepository {
  findById(id: string): Promise<Friendship | null>;
  findByRsql(rsql: string, page: number, size: number): Promise<Page<Friendship> | null>;
  save(friendship: Partial<Friendship>): Promise<Friendship>;
  update(id: string, friendship: Partial<Friendship>): Promise<Friendship>;
  deleteById(id: string): Promise<void>;
}
