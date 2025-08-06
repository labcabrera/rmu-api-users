import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Friendship } from '../../domain/entities/friendship.entity';

export type FriendshipDocument = Friendship & Document;

@Schema({ collection: 'friendship', versionKey: false })
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
