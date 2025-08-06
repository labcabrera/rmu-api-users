import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserSettings } from '../../domain/entities/user-settings.entity';

export type UserSettingsDocument = UserSettings & Document;

@Schema({ collection: 'user-settings', versionKey: false })
export class UserSettingsModel {
  @Prop({ required: true })
  _id: string;

  @Prop()
  measurementSystem: 'metric' | 'imperial';

  @Prop({ required: false })
  defaultRealm: string;

  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  theme: 'light' | 'dark';
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettingsModel);
