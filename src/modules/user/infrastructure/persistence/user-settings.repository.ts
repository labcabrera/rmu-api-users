import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserSettingsDocument, UserSettingsModel } from './user-settings.schema';
import { UserSettings } from '../../domain/entities/user-settings.entity';
import { UserSettingsRepositoryPort } from '../../application/ports/out/user-settings-repository.port';

@Injectable()
export class UserSettingsRepository implements UserSettingsRepositoryPort {
  constructor(@InjectModel(UserSettingsModel.name) private userSettingsModel: Model<UserSettingsDocument>) {}

  async findById(id: string): Promise<UserSettings | null> {
    const result = await this.userSettingsModel.findById(id).lean();
    return result ? this.mapToDomain(result) : null;
  }

  async save(user: Partial<UserSettings>): Promise<UserSettings> {
    const model = new this.userSettingsModel({
      ...user,
      _id: user.id,
    });
    const created = await model.save();
    return this.mapToDomain(created);
  }
  async update(id: string, user: Partial<UserSettings>): Promise<UserSettings> {
    const updated = await this.userSettingsModel.findByIdAndUpdate(id, user, {
      new: true,
    });
    return this.mapToDomain(updated!);
  }

  async deleteById(id: string): Promise<void> {
    await this.userSettingsModel.deleteOne({ _id: id });
  }

  private mapToDomain(doc: UserSettingsDocument): UserSettings {
    return new UserSettings(doc._id as string, doc.measurementSystem, doc.language, doc.theme);
  }
}
