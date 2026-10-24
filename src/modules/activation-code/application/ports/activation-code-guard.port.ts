import type { EntityGuard } from '../../../shared/application/ports/entity-guard.port.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';

export type ActivationCodeGuardPort = EntityGuard<ActivationCode>;
