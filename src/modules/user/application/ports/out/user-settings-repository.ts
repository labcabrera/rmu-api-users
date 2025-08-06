import { UserSettings } from 'src/modules/user/domain/entities/user-settings.entity';

export interface UserSettingsRepository {
  findById(id: string): Promise<UserSettings | null>;
  save(user: Partial<UserSettings>): Promise<UserSettings>;
  update(id: string, user: Partial<UserSettings>): Promise<UserSettings>;
  deleteById(id: string): Promise<void>;
  unsetRealm(realmId: string): Promise<number>;
}
