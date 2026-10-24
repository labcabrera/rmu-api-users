export interface UserApiResponse {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly enabled: boolean;
  readonly firstName?: string;
  readonly lastName?: string;
  /** Only present when the admin representation includes the federated identities. */
  readonly identityProvider?: string;
}

export interface UserGroup {
  readonly id: string;
  readonly name: string;
}

/**
 * Keycloak admin API. Only used as a fallback for users that have no RMU profile yet and to assign groups
 * when an activation code is redeemed. Never called on the GET /me hot path.
 */
export interface IamUserPort {
  findById(id: string): Promise<UserApiResponse | null>;
  /** Exact username match. */
  findByUsername(username: string): Promise<UserApiResponse | null>;
  /** Exact email match. */
  findByEmail(email: string): Promise<UserApiResponse | null>;
  addUserToGroup(userId: string, groupId: string): Promise<void>;
  findGroups(): Promise<UserGroup[]>;
}

export const IAM_USER_PORT = Symbol('IamUserPort');
