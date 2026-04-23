import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../../domain/aggregates/user';
import type { UserStatus } from '../../../domain/value-objects/user-status.vo';
import { UserSettings } from './user-settings.model';

export type UserDocument = User & Document;

@Schema({ collection: 'users', _id: false, versionKey: false })
export class UserModel {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Boolean, required: true })
  emailVerified: boolean;

  @Prop({ type: String, required: true })
  status: UserStatus;

  @Prop({ type: UserSettings, required: true })
  settings: UserSettings;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
