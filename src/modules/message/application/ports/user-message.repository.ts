import { Page } from 'src/modules/shared/domain/entities/page';
import { UserMessage } from '../../domain/aggregates/user-message';

export interface UserMessageRepository {
  findById(id: string): Promise<UserMessage | null>;
  findUnreadByUser(userId: string, page: number, size: number): Promise<Page<UserMessage>>;
  save(message: UserMessage): Promise<UserMessage>;
  update(id: string, message: Partial<UserMessage>): Promise<UserMessage>;
  deleteById(id: string): Promise<UserMessage | null>;
}
