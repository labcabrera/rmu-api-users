import { UserSettings } from '../value-objects/user-settings.vo.js';

export interface UserProps {
  id: string;
  /** RMU display name. Unique (case-insensitive) and owned by RMU, never synced back to Keycloak. */
  name: string;
  email: string;
  emailVerified: boolean;
  enabled: boolean;
  features: string[];
  settings: UserSettings;
  imageUrl: string | null;
  /** `local` for username/password accounts, the IdP alias (e.g. `google`) for brokered logins. */
  identityProvider: string;
  firstName: string | null;
  lastName: string | null;
  lastLoginAt: Date | null;
  /** Hash of the token claims the profile was last synced from. Null when never synced from a token. */
  claimsFingerprint: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
