import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, QueryFilter, Model } from 'mongoose';
import { QueryCriteria, type SortCriteria } from '../../../shared/application/criteria/query-criteria.js';
import { Page } from '../../../shared/application/pagination/page.js';
import { ConflictError } from '../../../shared/domain/errors/errors.js';
import { MongoBaseRepository } from '../../../shared/infrastructure/db/mongo.base.repository.js';
import { RsqlParser } from '../../../shared/infrastructure/db/rsql-parser.js';
import type { UserSummary } from '../../application/models/user-summary.js';
import { UserRepository } from '../../application/ports/user-repository.port.js';
import { User } from '../../domain/aggregates/user.js';
import { USER_NAME_COLLATION, type UserDocument, UserModel } from '../persistence/models/user.model.js';

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A duplicate key, as the base maps it on save (ConflictError) or as Mongo reports it on update (E11000). */
function isDuplicateKey(err: unknown): boolean {
  if (err instanceof ConflictError) return err.code === 'duplicate-key';
  return err instanceof Error && err.name === 'MongoServerError' && (err as { code?: number }).code === 11000;
}

@Injectable()
export class MongoUserRepository extends MongoBaseRepository<User, UserDocument> implements UserRepository {
  constructor(@InjectModel(UserModel.name) userModel: Model<UserDocument>, rsqlParser: RsqlParser) {
    super(userModel, rsqlParser);
  }

  async findByName(name: string): Promise<User | null> {
    const doc = await this.model.findOne({ name }).collation(USER_NAME_COLLATION);
    return doc ? this.toEntity(doc) : null;
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
      if (isDuplicateKey(err)) throw new ConflictError(`User ${entity.id} or name ${entity.name} already exists`, 'duplicate-key');
      throw err;
    }
  }

  async update(entity: User): Promise<User> {
    try {
      return await super.update(entity);
    } catch (err) {
      if (isDuplicateKey(err)) throw new ConflictError(`User name ${entity.name} is already in use`, 'duplicate-key');
      throw err;
    }
  }

  async updateLastLoginAt(id: string, at: Date): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { lastLoginAt: at } });
  }

  protected mapToEntity(doc: HydratedDocument<UserDocument>): User {
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
