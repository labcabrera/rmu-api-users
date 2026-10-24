import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserSettings } from '../../../domain/value-objects/user-settings.vo.js';

export class UserSettingsDto {
  @ApiProperty({ type: String, description: 'Measurement system used by the user', required: true, enum: ['metric', 'imperial'] })
  @IsString()
  measurementSystem: 'metric' | 'imperial';

  static fromEntity(user: UserSettings): UserSettingsDto {
    const dto = new UserSettingsDto();
    dto.measurementSystem = user.measurementSystem;
    return dto;
  }
}
