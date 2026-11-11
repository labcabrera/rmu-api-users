import type { Request } from 'express';

/**
 * The user that JwtStrategy.validate() puts on the request. It is built only from the access token claims.
 */
export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  emailVerified: boolean;
  username: string | undefined;
  given_name: string | undefined;
  family_name: string | undefined;
  name: string | undefined;
  roles: string[];
  /** Identity provider alias for brokered logins (e.g. `google`), `local` otherwise. */
  identityProvider: string;
}

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
