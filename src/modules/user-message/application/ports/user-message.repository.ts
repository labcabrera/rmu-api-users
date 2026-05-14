import { Page } from 'src/modules/shared/domain/entities/page';
import { UserMessage } from '../../domain/aggregates/user-message';
import { BaseRepository } from 'src/modules/shared/application/ports/base-repository';
import { QueryCriteria, SortCriteria } from 'src/modules/shared/application/criteria/query-criteria';

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
  abstract update(id: string, message: Partial<UserMessage>): Promise<UserMessage>;
  abstract deleteById(id: string): Promise<UserMessage | null>;
}
