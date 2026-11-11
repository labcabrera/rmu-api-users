import type { BaseRepository } from '../../../shared/application/ports/base-repository.port.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';
import { QueryCriteria, type SortCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { Page } from '../../../shared/application/pagination/page.js';

export interface ActivationCodeRepository extends BaseRepository<ActivationCode> {
  findById(id: string): Promise<ActivationCode | null>;
  findByRsql(
    rsql: string | undefined,
    page: number,
    size: number,
    filter?: QueryCriteria,
    sort?: SortCriteria,
  ): Promise<Page<ActivationCode>>;
  /** Throws ConflictError (`duplicate-key`) when the id or the code value already exists (whoever owns it). */
  save(entity: ActivationCode): Promise<ActivationCode>;
  /** Throws ConflictError (`version-conflict`) when the code changed since it was loaded. */
  update(entity: ActivationCode): Promise<ActivationCode>;
  deleteById(id: string): Promise<ActivationCode | null>;
  /** Exact match on the code value (parameterized query, never RSQL). */
  findByCode(code: string): Promise<ActivationCode | null>;
  /**
   * Atomically marks an unused code as activated by `userId`. Returns null when the code was already used, so two
   * concurrent activations cannot both succeed.
   */
  markActivated(id: string, userId: string, at: Date): Promise<ActivationCode | null>;
  /** Reverts markActivated when the group assignment failed. */
  clearActivation(id: string, userId: string): Promise<void>;
}

export const ACTIVATION_CODE_REPOSITORY = Symbol('ActivationCodeRepository');
