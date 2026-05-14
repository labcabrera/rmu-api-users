import { BaseRepository } from 'src/modules/shared/application/ports/base-repository';
import { ActivationCode } from '../../domain/aggregates/activation-code';
import { QueryCriteria, SortCriteria } from 'src/modules/shared/application/criteria/query-criteria';
import { Page } from 'src/modules/shared/domain/entities/page';

export abstract class ActivationCodeRepository implements BaseRepository<ActivationCode> {
  abstract findById(id: string): Promise<ActivationCode | null>;
  abstract findByRsql(
    rsql: string | undefined,
    page: number,
    size: number,
    filter?: QueryCriteria,
    sort?: SortCriteria,
  ): Promise<Page<ActivationCode>>;
  abstract save(entity: Partial<ActivationCode>): Promise<ActivationCode>;
  abstract update(id: string, entity: Partial<ActivationCode>): Promise<ActivationCode>;
  abstract deleteById(id: string): Promise<ActivationCode | null>;
  abstract findByCode(code: string): Promise<ActivationCode | null>;
}
