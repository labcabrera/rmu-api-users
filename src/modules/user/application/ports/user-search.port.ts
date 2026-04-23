export interface UserApiResponse {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly enabled: boolean;
}

/**
 * Interface to search for users from email in an external system (Keycloak).
 */
export interface UserSearchPort {
  findById(email: string): Promise<UserApiResponse | null>;
  findByEmail(email: string): Promise<UserApiResponse | null>;
}
