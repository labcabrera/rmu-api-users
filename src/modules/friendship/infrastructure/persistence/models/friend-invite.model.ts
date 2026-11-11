import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FriendInvite } from '../../../domain/aggregates/friend-invite.js';

export type FriendInviteDocument = FriendInvite & Document;

@Schema({ collection: 'friend_invite', _id: false, versionKey: false })
export class FriendInviteModel {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Number, default: 0 })
  version: number;

  /** SHA-256 of the token (spec 070, decision 4). */
  @Prop({ type: String, required: true })
  tokenHash: string;

  @Prop({ type: String, required: true })
  inviterId: string;

  @Prop({ type: String, required: true })
  inviterName: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const FriendInviteSchema = SchemaFactory.createForClass(FriendInviteModel);
FriendInviteSchema.index({ tokenHash: 1 }, { unique: true });
FriendInviteSchema.index({ inviterId: 1, expiresAt: 1 });
// Mongo removes an invite once it expired (the TTL monitor runs about every minute; reads also check the date).
FriendInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
