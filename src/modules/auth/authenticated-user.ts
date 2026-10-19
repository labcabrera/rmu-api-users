/**
 * The user attached to `req.user` by the JWT strategy. It is built only from the access token claims.
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

export const LOCAL_IDENTITY_PROVIDER = 'local';

export function mapJwtPayload(payload: Record<string, unknown>): AuthenticatedUser {
  const str = (value: unknown): string | undefined => (typeof value === 'string' && value.length > 0 ? value : undefined);
  const groups = Array.isArray(payload.groups) ? payload.groups.filter((g): g is string => typeof g === 'string') : [];
  return {
    id: payload.sub as string,
    email: str(payload.email),
    emailVerified: payload.email_verified === true,
    username: str(payload.preferred_username),
    given_name: str(payload.given_name),
    family_name: str(payload.family_name),
    name: str(payload.name),
    roles: groups,
    identityProvider: str(payload.identity_provider) ?? LOCAL_IDENTITY_PROVIDER,
  };
}
