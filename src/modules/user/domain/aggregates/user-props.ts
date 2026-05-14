import { UserSettings } from '../value-objects/user-settings.vo';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  enabled: boolean;
  features: string[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date | null;
}
