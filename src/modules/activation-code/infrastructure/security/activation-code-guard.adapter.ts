import { Injectable } from '@nestjs/common';
import type { ActivationCodeGuardPort } from '../../application/ports/activation-code-guard.port.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';
import { QueryCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { RMU_ADMIN } from '../../../shared/domain/entities/user-roles.js';
import { ForbiddenError } from '../../../shared/domain/errors/errors.js';

/**
 * Activation codes are managed by any `rmu-admin` (spec 021, decision 2), whoever created them; nobody else reads,
 * changes or deletes them. Checking and redeeming a code (`/check`, `/activate`) is open to every authenticated user.
 */
@Injectable()
export class ActivationCodeGuardAdapter implements ActivationCodeGuardPort {
  checkCreate(roles: string[]): void {
    this.requireAdmin(roles, 'create activation codes');
  }

  checkList(roles: string[]): void {
    this.requireAdmin(roles, 'list activation codes');
  }

  checkRead(_entity: ActivationCode | null, _userId: string, roles: string[]): void {
    this.requireAdmin(roles, 'read activation codes');
  }

  checkUpdate(_entity: ActivationCode | null, _userId: string, roles: string[]): void {
    this.requireAdmin(roles, 'update activation codes');
  }

  checkDelete(_entity: ActivationCode | null, _userId: string, roles: string[]): void {
    this.requireAdmin(roles, 'delete activation codes');
  }

  buildQueryPredicate(): QueryCriteria {
    return QueryCriteria.empty();
  }

  private requireAdmin(roles: string[], action: string): void {
    if (roles.includes(RMU_ADMIN)) return;
    throw new ForbiddenError(`You do not have permission to ${action}`);
  }
}
