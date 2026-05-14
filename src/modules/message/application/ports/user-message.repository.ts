import { Page } from 'src/modules/shared/domain/entities/page';
import { UserMessage } from '../../domain/aggregates/user-message';

export abstract class UserMessageRepository {
  abstract findById(id: string): Promise<UserMessage | null>;
  abstract findUnreadByUser(userId: string, page: number, size: number): Promise<Page<UserMessage>>;
  abstract save(message: UserMessage): Promise<UserMessage>;
  abstract update(id: string, message: Partial<UserMessage>): Promise<UserMessage>;
  abstract deleteById(id: string): Promise<UserMessage | null>;
}
