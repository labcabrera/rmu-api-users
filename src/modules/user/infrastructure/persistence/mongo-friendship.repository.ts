import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { FriendshipRepository } from '../../application/ports/out/friendship.repository';
import { Friendship } from '../../domain/entities/friendship.entity';
import { FriendshipDocument, FriendshipModel } from './friendship.schema';
import { rsqlToMongo } from './rsql-adapter';
import { Page } from '../../domain/entities/page';

@Injectable()
export class MongoFriendshipRepository implements FriendshipRepository {
  constructor(@InjectModel(FriendshipModel.name) private friendshipModel: Model<FriendshipDocument>) {}

  async findById(id: string): Promise<Friendship | null> {
    const friendship = await this.friendshipModel.findById(id);
    return friendship ? this.mapToDomain(friendship) : null;
  }

  async findByRsql(rsql: string, page: number, size: number): Promise<Page<Friendship> | null> {
    const query = rsql ? rsqlToMongo(rsql) : {};
    const skip = page * size;
    const [results, totalElements] = await Promise.all([
      this.friendshipModel.find(query).skip(skip).limit(size).sort({ createdAt: 1 }),
      this.friendshipModel.countDocuments(query),
    ]);
    const content = results.map((doc) => this.mapToDomain(doc));
    return {
      content,
      pagination: {
        page: page,
        size: size,
        totalElements,
        totalPages: Math.ceil(totalElements / size),
      },
    };
  }

  async save(friendship: Partial<Friendship>): Promise<Friendship> {
    const createdFriendship = new this.friendshipModel(friendship);
    await createdFriendship.save();
    return this.mapToDomain(createdFriendship);
  }

  async update(id: string, friendship: Partial<Friendship>): Promise<Friendship> {
    const updatedFriendship = await this.friendshipModel.findByIdAndUpdate(id, friendship, { new: true });
    if (!updatedFriendship) {
      throw new Error(`Friendship with id ${id} not found`);
    }
    return this.mapToDomain(updatedFriendship);
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.friendshipModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`Friendship with id ${id} not found`);
    }
  }

  private mapToDomain(doc: FriendshipDocument): Friendship {
    return new Friendship(doc._id as string, doc.requesterId, doc.addresseeId, doc.status, doc.createdAt, doc.updatedAt);
  }
}
