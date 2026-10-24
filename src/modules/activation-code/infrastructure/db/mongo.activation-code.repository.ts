import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository.js';
import { RsqlParser } from '../../../shared/infrastructure/db/rsql-parser.js';
import { ActivationCode } from '../../domain/aggregates/activation-code.js';
import { type ActivationCodeRepository } from '../../application/ports/activation-code-repository.port.js';
import { type ActivationCodeDocument, ActivationCodeModel } from '../persistence/models/activation-code.model.js';

@Injectable()
export class MongoActivationCodeRepository
  extends MongoBaseRepository<ActivationCode, ActivationCodeDocument>
  implements ActivationCodeRepository
{
  constructor(@InjectModel(ActivationCodeModel.name) activationCodeModel: Model<ActivationCodeDocument>, rsqlParser: RsqlParser) {
    super(activationCodeModel, rsqlParser);
  }

  async findByCode(code: string): Promise<ActivationCode | null> {
    if (typeof code !== 'string') return null;
    const doc = await this.model.findOne({ code: { $eq: code } });
    return doc ? this.toEntity(doc) : null;
  }

  async markActivated(id: string, userId: string, at: Date): Promise<ActivationCode | null> {
    const doc = await this.model.findOneAndUpdate(
      { _id: id, activatedAt: null, activatedBy: null },
      { $set: { activatedAt: at, activatedBy: userId, updatedAt: at }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
    return doc ? this.toEntity(doc) : null;
  }

  async clearActivation(id: string, userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: id, activatedBy: userId },
      { $set: { activatedAt: null, activatedBy: null, updatedAt: new Date() }, $inc: { version: 1 } },
    );
  }

  protected mapToEntity(doc: HydratedDocument<ActivationCodeDocument>): ActivationCode {
    return ActivationCode.fromProps({
      id: doc._id.toString(),
      code: doc.code,
      owner: doc.owner,
      features: doc.features,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      activatedAt: doc.activatedAt,
      activatedBy: doc.activatedBy ?? null,
      updatedAt: doc.updatedAt,
    });
  }
}
