import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserSettings } from '../../domain/entities/user-settings.entity';

export type FriendshipDocument = UserSettings & Document;

@Schema({ collection: 'user-settings', versionKey: false })
export class FriendshipModel {
  @Prop({ required: true })
  requesterId: string;

  @Prop({ required: true })
  addresseeId: string;

  @Prop({ required: true })
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: false })
  updatedAt?: Date;
}

export const FriendshipSchema = SchemaFactory.createForClass(FriendshipModel);
