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
 * Keycloak admin API. Used as a fallback for users that have no RMU profile yet, to assign groups when an activation
 * code is redeemed and for the user administration (spec 053). Never called on the GET /me hot path.
 */
export interface IamUserPort {
  findById(id: string): Promise<UserApiResponse | null>;
  /** Exact username match. */
  findByUsername(username: string): Promise<UserApiResponse | null>;
  /** Exact email match. */
  findByEmail(email: string): Promise<UserApiResponse | null>;
  addUserToGroup(userId: string, groupId: string): Promise<void>;
  removeUserFromGroup(userId: string, groupId: string): Promise<void>;
  /** Groups of the realm. */
  findGroups(): Promise<UserGroup[]>;
  /** Groups the user belongs to. */
  findUserGroups(userId: string): Promise<UserGroup[]>;
  /** Enables or disables the account: a disabled one cannot sign in. */
  setEnabled(userId: string, enabled: boolean): Promise<void>;
}

export const IAM_USER_PORT = Symbol('IamUserPort');
