import { BaseRepository } from 'src/modules/shared/application/ports/base-repository';
import { ActivationCode } from '../../domain/aggregates/activation-code';

export interface ActivationCodeRepository extends BaseRepository<ActivationCode> {
  findByCode(code: string, owner: string): Promise<ActivationCode | null>;
}
