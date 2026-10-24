import { ForbiddenError } from '../../domain/errors/errors.js';
import { RMU_ADMIN, RMU_USER } from '../../domain/entities/user-roles.js';
import type { RbacEntity } from '../../domain/entities/rbac-entity.js';
import { QueryCriteria } from '../../application/criteria/query-criteria.js';

/** Creating needs `rmu-user` or `rmu-admin` (spec 021, decision 2): a token without groups is read-only. */
export function checkCreateRole(roles: string[], what = 'this entity'): void {
  if (roles.includes(RMU_ADMIN) || roles.includes(RMU_USER)) return;
  throw new ForbiddenError(`You do not have permission to create ${what}`);
}

export abstract class BaseEntityGuard<E extends RbacEntity> implements BaseEntityGuard<E> {
  checkRead(entity: E, userId: string, roles: string[]) {
    if (entity.accessType === 'public') return;
    if (roles.includes(RMU_ADMIN)) return;
    if (entity.owner === userId) return;
    throw new ForbiddenError('You do not have permission to read this entity');
  }

  checkCreate(roles: string[]) {
    checkCreateRole(roles);
  }

  checkUpdate(entity: E, userId: string, roles: string[]) {
    if (roles.includes(RMU_ADMIN)) return;
    if (entity.owner === userId) return;
    throw new ForbiddenError('You do not have permission to update this entity');
  }

  checkDelete(entity: E, userId: string, roles: string[]) {
    if (roles.includes(RMU_ADMIN)) return;
    if (entity.owner === userId) return;
    throw new ForbiddenError('You do not have permission to delete this entity');
  }

  buildQueryPredicate(userId: string, roles: string[]): QueryCriteria {
    if (roles.includes(RMU_ADMIN)) return QueryCriteria.empty();
    return QueryCriteria.anyOf([QueryCriteria.eq('accessType', 'public'), QueryCriteria.eq('owner', userId)]);
  }
}
