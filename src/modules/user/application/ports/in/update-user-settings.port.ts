import { UpdateUserSettingsCommand } from 'src/modules/user/application/commands/update-settings.command';
import { UserSettings } from 'src/modules/user/domain/entities/user-settings.entity';

export interface UpdateUserSettingsPort {
  execute(command: UpdateUserSettingsCommand): Promise<UserSettings>;
}
