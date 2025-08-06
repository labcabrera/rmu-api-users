import { Inject, Injectable } from '@nestjs/common';

import { UserSettings } from '../../domain/entities/user-settings.entity';
import * as userSettingsRepositoryPort from '../ports/out/user-settings-repository';

@Injectable()
export class GetUserUserSettingsUseCase {
  constructor(
    @Inject('UserSettingsRepository')
    private readonly userRepo: userSettingsRepositoryPort.UserSettingsRepository,
  ) {}

  async execute(userId: string): Promise<UserSettings> {
    console.info('Reading user settings for userId:', userId);
    const settings = await this.userRepo.findById(userId);
    if (settings) {
      return settings;
    }
    console.info('Creating default user settings for userId:', userId);
    const defaultSettings: UserSettings = {
      id: userId,
      measurementSystem: 'metric',
      defaultRealm: null,
      language: 'en',
      theme: 'dark',
    };
    return await this.userRepo.save(defaultSettings);
  }
}
