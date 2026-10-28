import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo.js';

export type FriendshipDocument = Friendship & Document;

@Schema({ collection: 'friendship', _id: false, versionKey: false })
export class FriendshipModel {
  @Prop({ type: String, required: true })
  _id: string;

  /** Optimistic concurrency: +1 on each write. Documents stored before it existed have none (version 0). */
  @Prop({ type: Number, default: 0 })
  version: number;

  @Prop({ type: String, required: true })
  requesterId: string;

  @Prop({ type: String, required: true })
  requesterName: string;

  @Prop({ type: String, required: true })
  addresseeId: string;

  @Prop({ type: String, required: true })
  addresseeName: string;

  @Prop({ type: String, required: true })
  status: FriendshipStatus;

  /** Participant that blocked the friendship; null unless blocked (spec 044, decision 9). */
  @Prop({ type: String, required: false, default: null })
  blockedBy: string | null;

  @Prop({ type: String, required: false })
  message: string | null;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const FriendshipSchema = SchemaFactory.createForClass(FriendshipModel);
FriendshipSchema.index({ requesterId: 1, addresseeId: 1 });
FriendshipSchema.index({ addresseeId: 1, requesterId: 1 });
FriendshipSchema.index({ status: 1 });
