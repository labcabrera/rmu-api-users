import { UpdateUserSettingsCommand } from 'src/modules/user/application/cqrs/commands/update-settings.command';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';

export interface UpdateUserSettingsPort {
  execute(command: UpdateUserSettingsCommand): Promise<UserSettings>;
}
