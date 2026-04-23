import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FriendshipRepository } from '../../application/ports/friendship.repository';
import { Friendship } from '../../domain/aggregates/friendship';
import { FriendshipDocument, FriendshipModel } from '../persistence/friendship.model';
import { MongoBaseRepository } from 'src/modules/shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from 'src/modules/shared/infrastructure/persistence/repositories/rsql-parser';

@Injectable()
export class MongoFriendshipRepository extends MongoBaseRepository<Friendship, FriendshipDocument> implements FriendshipRepository {
  constructor(@InjectModel(FriendshipModel.name) friendshipModel: Model<FriendshipDocument>, rsqlParser: RsqlParser) {
    super(friendshipModel, rsqlParser);
  }

  protected mapToEntity(doc: FriendshipDocument): Friendship {
    return Friendship.fromProps({
      id: doc._id.toString(),
      requesterId: doc.requesterId,
      addresseeId: doc.addresseeId,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
