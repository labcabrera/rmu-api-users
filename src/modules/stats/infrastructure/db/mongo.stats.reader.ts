import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { ActivationCodeModel } from '../../../activation-code/infrastructure/persistence/models/activation-code.model.js';
import { UserModel } from '../../../user/infrastructure/persistence/models/user.model.js';
import type { StatsReader } from '../../application/ports/stats-reader.port.js';
import { startOfMonth } from '../../domain/collection-stats.js';
import { ACTIVE_DAYS, type ActivationCodeStats, type UsersApiStats } from '../../domain/users-api-stats.js';
import { readCollectionStats } from './collection-stats.reader.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MongoStatsReader implements StatsReader {
  constructor(
    @InjectModel(UserModel.name) private readonly users: Model<UserModel>,
    @InjectModel(ActivationCodeModel.name) private readonly codes: Model<ActivationCodeModel>,
  ) {}

  async read(now: Date): Promise<UsersApiStats> {
    const [users, active, newThisMonth, activationCodes] = await Promise.all([
      readCollectionStats(this.users, now),
      this.users.countDocuments({ lastLoginAt: { $gte: new Date(now.getTime() - ACTIVE_DAYS * DAY_MS) } }),
      this.users.countDocuments({ createdAt: { $gte: startOfMonth(now) } }),
      this.readCodes(now),
    ]);
    return { users: { ...users, active, newThisMonth }, activationCodes };
  }

  private async readCodes(now: Date): Promise<ActivationCodeStats> {
    const [total, used, expired] = await Promise.all([
      this.codes.countDocuments({}),
      this.codes.countDocuments({ activatedAt: { $ne: null } }),
      this.codes.countDocuments({ activatedAt: null, expiresAt: { $lt: now } }),
    ]);
    return { total, used, expired, free: total - used - expired };
  }
}
