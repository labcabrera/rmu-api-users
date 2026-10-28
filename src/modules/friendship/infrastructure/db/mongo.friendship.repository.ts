import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import type { FriendshipRepository } from '../../application/ports/friendship-repository.port.js';
import { Friendship } from '../../domain/aggregates/friendship.js';
import { type FriendshipDocument, FriendshipModel } from '../persistence/models/friendship.model.js';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository.js';
import { RsqlParser } from '../../../shared/infrastructure/db/rsql-parser.js';
import { Page } from '../../../shared/application/pagination/page.js';
import { QueryCriteria } from '../../../shared/application/criteria/query-criteria.js';

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
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
    });
    return doc ? this.toEntity(doc) : null;
  }

  protected mapToEntity(doc: HydratedDocument<FriendshipDocument>): Friendship {
    return Friendship.fromProps({
      id: doc._id.toString(),
      requesterId: doc.requesterId,
      requesterName: doc.requesterName,
      addresseeId: doc.addresseeId,
      addresseeName: doc.addresseeName,
      status: doc.status,
      blockedBy: doc.blockedBy ?? null,
      message: doc.message,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
