import { Page } from '../../../shared/application/pagination/page.js';
import { UserMessage } from '../../domain/aggregates/user-message.js';
import type { BaseRepository } from '../../../shared/application/ports/base-repository.port.js';
import { QueryCriteria, type SortCriteria } from '../../../shared/application/criteria/query-criteria.js';

export interface UserMessageRepository extends BaseRepository<UserMessage> {
  findById(id: string): Promise<UserMessage | null>;
  findByRsql(rsql: string | undefined, page: number, size: number, filter?: QueryCriteria, sort?: SortCriteria): Promise<Page<UserMessage>>;
  save(message: UserMessage): Promise<UserMessage>;
  update(message: UserMessage): Promise<UserMessage>;
  deleteById(id: string): Promise<UserMessage | null>;
}

export const USER_MESSAGE_REPOSITORY = Symbol('UserMessageRepository');
