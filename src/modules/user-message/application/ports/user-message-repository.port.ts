import { Page } from '../../../shared/application/pagination/page.js';
import { UserMessage } from '../../domain/aggregates/user-message.js';
import type { BaseRepository } from '../../../shared/application/ports/base-repository.port.js';
import { QueryCriteria, type SortCriteria } from '../../../shared/application/criteria/query-criteria.js';

export abstract class UserMessageRepository implements BaseRepository<UserMessage> {
  abstract findById(id: string): Promise<UserMessage | null>;
  abstract findByRsql(
    rsql: string | undefined,
    page: number,
    size: number,
    filter?: QueryCriteria,
    sort?: SortCriteria,
  ): Promise<Page<UserMessage>>;
  abstract save(message: UserMessage): Promise<UserMessage>;
  abstract update(message: UserMessage): Promise<UserMessage>;
  abstract deleteById(id: string): Promise<UserMessage | null>;
}
