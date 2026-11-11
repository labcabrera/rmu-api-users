/** Token claims the profile is provisioned from (see AuthenticatedUser). */
export interface UserClaims {
  id: string;
  email: string | undefined;
  emailVerified: boolean;
  username: string | undefined;
  givenName: string | undefined;
  familyName: string | undefined;
  groups: string[];
  identityProvider: string;
}
