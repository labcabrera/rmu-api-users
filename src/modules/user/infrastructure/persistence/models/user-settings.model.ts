import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class UserSettings {
  @Prop({ type: String, required: true })
  measurementSystem: 'metric' | 'imperial';
}
