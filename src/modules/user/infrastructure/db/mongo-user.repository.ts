import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { QueryFilter, Model } from 'mongoose';
import { QueryCriteria, SortCriteria } from '../../../shared/application/criteria/query-criteria';
import { Page } from '../../../shared/domain/entities/page';
import { ConflictError } from '../../../shared/domain/errors/errors';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository';
import { RsqlParser } from '../../../shared/infrastructure/persistence/repositories/rsql-parser';
import { UserSummary } from '../../application/models/user-summary';
import { UserRepository } from '../../application/ports/user-repository';
import { User } from '../../domain/aggregates/user';
import { USER_NAME_COLLATION, UserDocument, UserModel } from '../persistence/models/user.model';

const DUPLICATE_KEY = 11000;

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;
}

@Injectable()
export class MongoUserRepository extends MongoBaseRepository<User, UserDocument> implements UserRepository {
  constructor(@InjectModel(UserModel.name) userModel: Model<UserDocument>, rsqlParser: RsqlParser) {
    super(userModel, rsqlParser);
  }

  async findByName(name: string): Promise<User | null> {
    const doc = await this.model.findOne({ name }).collation(USER_NAME_COLLATION);
    return doc ? this.mapToEntity(doc) : null;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const filter: QueryFilter<UserDocument> = excludeId ? { name, _id: { $ne: excludeId } } : { name };
    const doc = await this.model.findOne(filter, { _id: 1 }).collation(USER_NAME_COLLATION).lean();
    return doc !== null;
  }

  async searchByNamePrefix(prefix: string, page: number, size: number): Promise<Page<UserSummary>> {
    const filter: QueryFilter<UserDocument> = { name: { $regex: `^${escapeRegex(prefix)}`, $options: 'i' }, enabled: true };
    const [docs, total] = await Promise.all([
      this.model
        .find(filter, { _id: 1, name: 1, imageUrl: 1 })
        .sort({ name: 1 })
        .skip(page * size)
        .limit(size)
        .lean<{ _id: string; name: string; imageUrl?: string | null }[]>(),
      this.model.countDocuments(filter),
    ]);
    const content = docs.map(doc => ({ id: doc._id, name: doc.name, imageUrl: doc.imageUrl ?? null }));
    return new Page<UserSummary>(content, page, size, total);
  }

  findByRsql(rsql: string | undefined, page: number, size: number, filter?: QueryCriteria, sort?: SortCriteria): Promise<Page<User>> {
    return super.findByRsql(rsql ?? '', page, size, filter, sort);
  }

  async save(entity: User): Promise<User> {
    try {
      return await super.save(entity);
    } catch (err) {
      if (isDuplicateKey(err)) throw new ConflictError(`User ${entity.id} or name ${entity.name} already exists`);
      throw err;
    }
  }

  async update(id: string, entity: Partial<User>): Promise<User> {
    try {
      return await super.update(id, entity);
    } catch (err) {
      if (isDuplicateKey(err)) throw new ConflictError(`User name ${entity.name} is already in use`);
      throw err;
    }
  }

  async updateLastLoginAt(id: string, at: Date): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { lastLoginAt: at } });
  }

  protected mapToEntity(doc: UserDocument): User {
    return User.fromProps({
      id: String(doc._id),
      name: doc.name,
      email: doc.email ?? '',
      emailVerified: doc.emailVerified,
      enabled: doc.enabled,
      features: doc.features,
      imageUrl: doc.imageUrl ?? null,
      settings: doc.settings,
      identityProvider: doc.identityProvider ?? 'local',
      firstName: doc.firstName ?? null,
      lastName: doc.lastName ?? null,
      lastLoginAt: doc.lastLoginAt ?? null,
      claimsFingerprint: doc.claimsFingerprint ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt ?? null,
    });
  }
}
