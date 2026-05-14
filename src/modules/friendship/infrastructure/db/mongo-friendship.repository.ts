import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FriendshipRepository } from '../../application/ports/friendship.repository';
import { Friendship } from '../../domain/aggregates/friendship';
import { FriendshipDocument, FriendshipModel } from '../persistence/models/friendship.model';
import { MongoBaseRepository } from 'src/modules/shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from 'src/modules/shared/infrastructure/persistence/repositories/rsql-parser';
import { Page } from 'src/modules/shared/domain/entities/page';
import { QueryCriteria } from 'src/modules/shared/application/criteria/query-criteria';

@Injectable()
export class MongoFriendshipRepository extends MongoBaseRepository<Friendship, FriendshipDocument> implements FriendshipRepository {
  constructor(@InjectModel(FriendshipModel.name) friendshipModel: Model<FriendshipDocument>, rsqlParser: RsqlParser) {
    super(friendshipModel, rsqlParser);
  }

  async findByRsql(rsql: string | undefined, page: number, size: number, filter?: QueryCriteria): Promise<Page<Friendship>> {
    return super.findByRsql(rsql ?? '', page, size, filter);
  }

  async findByParticipants(userId: string, friendId: string): Promise<Friendship | null> {
    const doc = await this.model.findOne({
      $or: [
        { requesterId: userId, addresseeName: friendId },
        { requesterId: friendId, addresseeName: userId },
      ],
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  protected mapToEntity(doc: FriendshipDocument): Friendship {
    return Friendship.fromProps({
      id: doc._id.toString(),
      requesterId: doc.requesterId,
      addresseeName: doc.addresseeName,
      status: doc.status,
      message: doc.message,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
