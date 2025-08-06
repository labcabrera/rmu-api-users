import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserSettings } from '../../domain/entities/user-settings.entity';

export type UserSettingsDocument = UserSettings & Document;

@Schema({ collection: 'user-settings' })
export class UserSettingsModel {
  @Prop()
  id: string;

  @Prop()
  measurementSystem: 'metric' | 'imperial';

  @Prop()
  language: string;

  @Prop()
  theme: 'light' | 'dark';
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettingsModel);
