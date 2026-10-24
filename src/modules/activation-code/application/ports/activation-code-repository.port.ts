import type { BaseRepository } from '../../../shared/application/ports/base-repository.port.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';
import { QueryCriteria, type SortCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { Page } from '../../../shared/application/pagination/page.js';

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
  /** Exact match on the code value (parameterized query, never RSQL). */
  abstract findByCode(code: string): Promise<ActivationCode | null>;
  /**
   * Atomically marks an unused code as activated by `userId`. Returns null when the code was already used, so two
   * concurrent activations cannot both succeed.
   */
  abstract markActivated(id: string, userId: string, at: Date): Promise<ActivationCode | null>;
  /** Reverts markActivated when the group assignment failed. */
  abstract clearActivation(id: string, userId: string): Promise<void>;
}
