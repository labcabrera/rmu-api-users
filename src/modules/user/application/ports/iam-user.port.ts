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
export abstract class IamUserPort {
  abstract findById(id: string): Promise<UserApiResponse | null>;
  /** Exact username match. */
  abstract findByUsername(username: string): Promise<UserApiResponse | null>;
  /** Exact email match. */
  abstract findByEmail(email: string): Promise<UserApiResponse | null>;
  abstract addUserToGroup(userId: string, groupId: string): Promise<void>;
  abstract findGroups(): Promise<UserGroup[]>;
}
