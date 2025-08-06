export interface UserApiResponse {
  readonly id: string;
  readonly username: string;
  readonly email: string;
}

/**
 * Interface to search for users from email in an external system (Keycloak).
 */
export interface UserSearchPort {
  findByEmail(email: string): Promise<UserApiResponse | null>;
}
