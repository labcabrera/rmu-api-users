import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';

export class UserSettingsDto {
  @ApiProperty({ description: 'Measurement system used by the user', required: true, enum: ['metric', 'imperial'] })
  @IsString()
  measurementSystem: 'metric' | 'imperial';

  static fromEntity(user: UserSettings): UserSettingsDto {
    const dto = new UserSettingsDto();
    dto.measurementSystem = user.measurementSystem;
    return dto;
  }
}
