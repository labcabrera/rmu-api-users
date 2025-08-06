import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../application/ports/out/user-repository.port';
import { UserDocument, UserModel } from './user.schema';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.userModel.findById(id).lean();
    return result ? this.mapToDomain(result) : null;
  }

  async findAll(): Promise<User[]> {
    const results = await this.userModel.find().lean();
    return results.map((e) => this.mapToDomain(e));
  }

  async save(user: Partial<User>): Promise<User> {
    const model = new this.userModel(user);
    const created = await model.save();
    return this.mapToDomain(created);
  }
  async update(id: string, user: Partial<User>): Promise<User> {
    const updated = await this.userModel.findByIdAndUpdate(id, user, {
      new: true,
    });
    return this.mapToDomain(updated!);
  }

  async deleteById(id: string): Promise<void> {
    await this.userModel.deleteOne({ _id: id });
  }

  private mapToDomain(userDoc: UserDocument): User {
    return new User(userDoc._id as string, userDoc.username, userDoc.email);
  }
}
