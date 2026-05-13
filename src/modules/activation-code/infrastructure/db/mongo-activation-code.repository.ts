import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from 'src/modules/shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from 'src/modules/shared/infrastructure/persistence/repositories/rsql-parser';
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

  async findByCode(code: string, owner: string): Promise<ActivationCode | null> {
    const doc = await this.model.findOne({ code, owner });
    return doc ? this.mapToEntity(doc) : null;
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
      updatedAt: doc.updatedAt,
    });
  }
}
