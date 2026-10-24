import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from '../../../shared/infrastructure/persistence/repositories/rsql-parser';
import { ActivationCode } from '../../domain/aggregates/activation-code';
import { ActivationCodeRepository } from '../../application/ports/activation-code.repository';
import { ActivationCodeDocument, ActivationCodeModel } from '../persistence/models/activation-code.model';

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
    return doc ? this.mapToEntity(doc) : null;
  }

  async markActivated(id: string, userId: string, at: Date): Promise<ActivationCode | null> {
    const doc = await this.model.findOneAndUpdate(
      { _id: id, activatedAt: null, activatedBy: null },
      { $set: { activatedAt: at, activatedBy: userId, updatedAt: at } },
      { new: true },
    );
    return doc ? this.mapToEntity(doc) : null;
  }

  async clearActivation(id: string, userId: string): Promise<void> {
    await this.model.updateOne({ _id: id, activatedBy: userId }, { $set: { activatedAt: null, activatedBy: null, updatedAt: new Date() } });
  }

  protected mapToEntity(doc: ActivationCodeDocument): ActivationCode {
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
