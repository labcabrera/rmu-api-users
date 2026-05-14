import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryCriteria } from 'src/modules/shared/application/criteria/query-criteria';
import { Page } from 'src/modules/shared/domain/entities/page';
import { MongoBaseRepository } from 'src/modules/shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from 'src/modules/shared/infrastructure/persistence/repositories/rsql-parser';
import { UserMessageRepository } from '../../application/ports/user-message.repository';
import { UserMessage } from '../../domain/aggregates/user-message';
import { UserMessageDocument, UserMessageModel } from '../persistence/models/user-message.model';

@Injectable()
export class MongoUserMessageRepository extends MongoBaseRepository<UserMessage, UserMessageDocument> implements UserMessageRepository {
  constructor(@InjectModel(UserMessageModel.name) messageModel: Model<UserMessageDocument>, rsqlParser: RsqlParser) {
    super(messageModel, rsqlParser);
  }

  async findUnreadByUser(userId: string, page: number, size: number): Promise<Page<UserMessage>> {
    return this.findByRsql('', page, size, QueryCriteria.allOf([QueryCriteria.eq('userId', userId), QueryCriteria.eq('readed', null)]), {
      createdAt: 'desc',
    });
  }

  protected mapToEntity(doc: UserMessageDocument): UserMessage {
    return UserMessage.fromProps({
      id: doc._id.toString(),
      userId: doc.userId,
      message: doc.message,
      type: doc.type,
      readed: doc.readed,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
