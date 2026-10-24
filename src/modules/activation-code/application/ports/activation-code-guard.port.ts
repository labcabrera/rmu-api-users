import { EntityGuard } from '../../../shared/application/ports/entity-guard.port';
import { ActivationCode } from '../../domain/aggregates/activation-code';

export type ActivationCodeGuardPort = EntityGuard<ActivationCode>;
