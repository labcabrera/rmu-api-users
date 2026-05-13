import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ActivationCode } from '../../../domain/aggregates/activation-code';

export type ActivationCodeDocument = ActivationCode & Document;

@Schema({ collection: 'activation_codes', _id: false, versionKey: false })
export class ActivationCodeModel {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  code: string;

  @Prop({ type: String, required: true, index: true })
  owner: string;

  @Prop({ type: [String], required: true })
  features: import('../../../domain/aggregates/activation-code-props').ActivationFeature[];

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  @Prop({ type: String, required: false })
  activatedBy?: string | null;

  @Prop({ type: Date, required: false })
  activatedAt: Date | null;

  @Prop({ type: Date, required: false })
  updatedAt: Date | null;
}

export const ActivationCodeSchema = SchemaFactory.createForClass(ActivationCodeModel);
ActivationCodeSchema.index({ owner: 1, code: 1 }, { unique: true });
