import { Inject, Injectable } from '@nestjs/common';

import { UserSettings } from '../../domain/entities/user-settings.entity';
import * as userSettingsRepositoryPort from '../ports/out/user-settings-repository';
import { UpdateUserSettingsCommand } from '../commands/update-settings.command';

@Injectable()
export class UpdateUserUserSettingsUseCase {
  constructor(
    @Inject('UserSettingsRepositoryPort')
    private readonly userRepo: userSettingsRepositoryPort.UserSettingsRepository,
  ) {}

  async execute(command: UpdateUserSettingsCommand): Promise<UserSettings> {
    console.info('Updating settings userId:', command.id);
    const id = command.id;
    const query = {};
    if (command.measurementSystem) {
      query['measurementSystem'] = command.measurementSystem;
    }
    if (command.language) {
      query['language'] = command.language;
    }
    if (command.theme) {
      query['theme'] = command.theme;
    }
    if (Object.keys(query).length === 0) {
      throw new Error('No settings to update');
    }
    console.info('Update query:', query);
    return await this.userRepo.update(id, query);
  }
}
