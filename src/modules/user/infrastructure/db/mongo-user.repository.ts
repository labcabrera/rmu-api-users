import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from 'src/modules/shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from 'src/modules/shared/infrastructure/persistence/repositories/rsql-parser';
import { UserDocument, UserModel } from '../persistence/models/user.model';
import { User } from '../../domain/aggregates/user';
import { UserRepository } from '../../application/ports/user-repository';

@Injectable()
export class MongoUserRepository extends MongoBaseRepository<User, UserDocument> implements UserRepository {
  constructor(@InjectModel(UserModel.name) friendshipModel: Model<UserDocument>, rsqlParser: RsqlParser) {
    super(friendshipModel, rsqlParser);
  }

  protected mapToEntity(doc: UserDocument): User {
    return User.fromProps({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      emailVerified: doc.emailVerified,
      enabled: doc.enabled,
      features: doc.features,
      settings: doc.settings,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
