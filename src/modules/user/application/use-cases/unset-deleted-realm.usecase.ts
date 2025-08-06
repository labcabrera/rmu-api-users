import { Inject, Injectable, Logger } from '@nestjs/common';

import * as userSettingsRepositoryPort from '../ports/out/user-settings-repository';

@Injectable()
export class UnsetDeletedRealmUseCase {
  private readonly logger = new Logger(UnsetDeletedRealmUseCase.name);

  constructor(
    @Inject('UserSettingsRepository')
    private readonly userRepo: userSettingsRepositoryPort.UserSettingsRepository,
  ) {}

  async execute(realmId: string): Promise<void> {
    this.logger.log(`Unsetting deleted realm for realmId: ${realmId}`);
    const updated = await this.userRepo.unsetRealm(realmId);
    this.logger.log(`Unset deleted realm for realmId: ${realmId}, updated: ${updated}`);
  }
}
