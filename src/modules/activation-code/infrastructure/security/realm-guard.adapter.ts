import { Injectable } from '@nestjs/common';
import { ActivationCodeGuardPort } from '../../application/ports/activation-code-guard.port';
import { ActivationCode } from '../../domain/aggregates/activation-code';
import { QueryCriteria } from 'src/modules/shared/application/criteria/query-criteria';
import { RMU_ADMIN } from 'src/modules/shared/domain/entities/user-roles';
import { ForbiddenError } from 'src/modules/shared/domain/errors/errors';

@Injectable()
export class ActivationCodeGuardAdapter implements ActivationCodeGuardPort {
  checkCreate(roles: string[]): void {
    if (roles.includes(RMU_ADMIN)) return;
    throw new ForbiddenError('You do not have permission to read this entity');
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
  buildQueryPredicate(userId: string, roles: string[]): QueryCriteria {
    return QueryCriteria.empty();
  }
}
