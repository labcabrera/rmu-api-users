import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Friendship } from '../../domain/aggregates/friendship';

export type FriendshipDocument = Friendship & Document;

@Schema({ collection: 'friendship', _id: false, versionKey: false })
export class FriendshipModel {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true })
  requesterId: string;

  @Prop({ type: String, required: true })
  addresseeId: string;

  @Prop({ type: String, required: true })
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const FriendshipSchema = SchemaFactory.createForClass(FriendshipModel);
