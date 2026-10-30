export type UserRole = 'rmu-admin' | 'rmu-user';

export const RMU_ADMIN: UserRole = 'rmu-admin';
export const RMU_USER: UserRole = 'rmu-user';

/** Realm groups an administrator can grant or take away (the groups of the Keycloak Terraform). */
export const MANAGED_GROUPS = ['rmu-user', 'rmu-admin', 'rmu-core-law', 'rmu-spell-law', 'rmu-treasure-law', 'rmu-creature-law-i'] as const;
export type ManagedGroup = (typeof MANAGED_GROUPS)[number];
