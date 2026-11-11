import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';

export type ActivationCodeDocument = ActivationCode & Document;

@Schema({ collection: 'activation-codes', _id: false, versionKey: false })
export class ActivationCodeModel {
  @Prop({ type: String, required: true })
  _id: string;

  /** Optimistic concurrency: +1 on each write. Documents stored before it existed have none (version 0). */
  @Prop({ type: Number, default: 0 })
  version: number;

  /** Unique across owners (F-users-11); scripts/activation-code-unique-index.mjs moves existing databases to it. */
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true, index: true })
  owner: string;

  @Prop({ type: [String], required: true })
  features: import('../../../domain/aggregates/activation-code-props.js').ActivationFeature[];

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  @Prop({ type: String, required: false })
  activatedBy?: string | null;

  @Prop({ type: Date, required: false })
  activatedAt: Date | null;

  @Prop({ type: String, required: false })
  note?: string | null;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const ActivationCodeSchema = SchemaFactory.createForClass(ActivationCodeModel);
ActivationCodeSchema.index({ code: 1 }, { unique: true, name: 'code_1' });
