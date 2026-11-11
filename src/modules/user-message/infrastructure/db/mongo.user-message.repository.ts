import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository.js';
import { RsqlParser } from '../../../shared/infrastructure/db/rsql-parser.js';
import { type UserMessageRepository } from '../../application/ports/user-message-repository.port.js';
import { UserMessage } from '../../domain/aggregates/user-message.js';
import { type UserMessageDocument, UserMessageModel } from '../persistence/models/user-message.model.js';

@Injectable()
export class MongoUserMessageRepository extends MongoBaseRepository<UserMessage, UserMessageDocument> implements UserMessageRepository {
  constructor(@InjectModel(UserMessageModel.name) messageModel: Model<UserMessageDocument>, rsqlParser: RsqlParser) {
    super(messageModel, rsqlParser);
  }

  protected mapToEntity(doc: HydratedDocument<UserMessageDocument>): UserMessage {
    return UserMessage.fromProps({
      id: doc._id.toString(),
      userId: doc.userId,
      from: doc.from,
      message: doc.message,
      type: doc.type,
      readed: doc.readed,
      createdAt: doc.createdAt,
    });
  }
}
