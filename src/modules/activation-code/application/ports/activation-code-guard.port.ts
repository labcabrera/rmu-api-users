import { EntityGuard } from '../../../shared/application/ports/entity-guard';
import { ActivationCode } from '../../domain/aggregates/activation-code';

export type ActivationCodeGuardPort = EntityGuard<ActivationCode>;
