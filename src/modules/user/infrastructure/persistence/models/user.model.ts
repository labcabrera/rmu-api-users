import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../../domain/aggregates/user.js';
import { UserSettings } from './user-settings.model.js';

export type UserDocument = User & Document;

/** Case-insensitive collation used by the unique display name index and every lookup by name. */
export const USER_NAME_COLLATION = { locale: 'en', strength: 2 };

@Schema({ collection: 'users', _id: false, versionKey: false })
export class UserModel {
  @Prop({ type: String, required: true })
  _id: string;

  /** Optimistic concurrency: +1 on each write. Documents stored before it existed have none (version 0). */
  @Prop({ type: Number, default: 0 })
  version: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false, default: '' })
  email: string;

  @Prop({ type: Boolean, required: true })
  emailVerified: boolean;

  @Prop({ type: Boolean, required: true })
  public enabled: boolean;

  @Prop({ type: [String], required: true })
  public features: string[];

  @Prop({ type: String, required: false })
  public imageUrl: string | null;

  @Prop({ type: UserSettings, required: true })
  settings: UserSettings;

  @Prop({ type: String, required: false, default: 'local' })
  identityProvider: string;

  @Prop({ type: String, required: false })
  firstName: string | null;

  @Prop({ type: String, required: false })
  lastName: string | null;

  @Prop({ type: Date, required: false })
  lastLoginAt: Date | null;

  @Prop({ type: String, required: false })
  claimsFingerprint: string | null;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
UserSchema.index({ name: 1 }, { unique: true, collation: USER_NAME_COLLATION });
