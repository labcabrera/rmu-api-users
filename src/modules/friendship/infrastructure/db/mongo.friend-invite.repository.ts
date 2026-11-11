import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository.js';
import { RsqlParser } from '../../../shared/infrastructure/db/rsql-parser.js';
import type { FriendInviteRepository } from '../../application/ports/friend-invite-repository.port.js';
import { FriendInvite } from '../../domain/aggregates/friend-invite.js';
import { type FriendInviteDocument, FriendInviteModel } from '../persistence/models/friend-invite.model.js';

@Injectable()
export class MongoFriendInviteRepository extends MongoBaseRepository<FriendInvite, FriendInviteDocument> implements FriendInviteRepository {
  constructor(@InjectModel(FriendInviteModel.name) model: Model<FriendInviteDocument>, rsqlParser: RsqlParser) {
    super(model, rsqlParser);
  }

  async renameInviter(userId: string, name: string): Promise<void> {
    await this.model.updateMany({ inviterId: userId, inviterName: { $ne: name } }, { $set: { inviterName: name }, $inc: { version: 1 } });
  }

  async findActiveByTokenHash(tokenHash: string, now: Date): Promise<FriendInvite | null> {
    const doc = await this.model.findOne({ tokenHash, expiresAt: { $gt: now } });
    return doc ? this.toEntity(doc) : null;
  }

  async findActiveByInviter(inviterId: string, now: Date): Promise<FriendInvite[]> {
    const docs = await this.model.find({ inviterId, expiresAt: { $gt: now } }).sort({ createdAt: -1 });
    return docs.map(doc => this.toEntity(doc));
  }

  countActiveByInviter(inviterId: string, now: Date): Promise<number> {
    return this.model.countDocuments({ inviterId, expiresAt: { $gt: now } });
  }

  async consume(id: string, now: Date): Promise<boolean> {
    const deleted = await this.model.findOneAndDelete({ _id: id, expiresAt: { $gt: now } });
    return deleted !== null;
  }

  protected mapToEntity(doc: HydratedDocument<FriendInviteDocument>): FriendInvite {
    return FriendInvite.fromProps({
      id: doc._id.toString(),
      tokenHash: doc.tokenHash,
      inviterId: doc.inviterId,
      inviterName: doc.inviterName,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    });
  }
}
