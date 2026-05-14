import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserMessage } from '../../../domain/aggregates/user-message';
import type { MessageType } from '../../../domain/value-objects/message-type.vo';

export type UserMessageDocument = UserMessage & Document;

@Schema({ collection: 'user_messages', _id: false, versionKey: false })
export class UserMessageModel {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true })
  type: MessageType;

  @Prop({ type: Date, required: false })
  readed: Date | null;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const UserMessageSchema = SchemaFactory.createForClass(UserMessageModel);
UserMessageSchema.index({ userId: 1, readed: 1, createdAt: -1 });
