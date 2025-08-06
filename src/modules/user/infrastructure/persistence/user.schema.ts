import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserModel & Document;

@Schema({ collection: 'users' })
export class UserModel {
  // @Prop()
  // id: string;

  @Prop()
  username: string;

  @Prop()
  email: string;

  @Prop()
  friends: string[];
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
