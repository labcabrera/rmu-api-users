import { Injectable } from '@nestjs/common';
import type { ActivationCodeGuardPort } from '../../application/ports/activation-code-guard.port.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';
import { QueryCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { RMU_ADMIN } from '../../../shared/domain/entities/user-roles.js';
import { ForbiddenError } from '../../../shared/domain/errors/errors.js';

@Injectable()
export class ActivationCodeGuardAdapter implements ActivationCodeGuardPort {
  checkCreate(roles: string[]): void {
    if (roles.includes(RMU_ADMIN)) return;
    throw new ForbiddenError('You do not have permission to create activation codes');
  }
  checkRead(entity: ActivationCode, userId: string, roles: string[]): void {
    if (roles.includes(RMU_ADMIN)) return;
    throw new ForbiddenError('You do not have permission to read this entity');
  }
  checkUpdate(entity: ActivationCode, userId: string, roles: string[]): void {
    if (roles.includes(RMU_ADMIN)) return;
    throw new ForbiddenError('You do not have permission to read this entity');
  }
  checkDelete(entity: ActivationCode, userId: string, roles: string[]): void {
    if (roles.includes(RMU_ADMIN)) return;
    throw new ForbiddenError('You do not have permission to read this entity');
  }
  buildQueryPredicate(): QueryCriteria {
    return QueryCriteria.empty();
  }
}
