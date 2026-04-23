import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';

export class UserSettingsDto {
  @ApiProperty({ description: 'Measurement system used by the user', required: true, enum: ['metric', 'imperial'] })
  @IsString()
  measurementSystem: 'metric' | 'imperial';

  @ApiProperty({ description: 'Language preference of the user', required: true })
  @IsString()
  language: string;

  @ApiProperty({ description: 'Theme preference of the user', required: true, enum: ['light', 'dark'] })
  @IsString()
  theme: 'light' | 'dark';

  static fromEntity(user: UserSettings): UserSettingsDto {
    const dto = new UserSettingsDto();
    dto.measurementSystem = user.measurementSystem;
    dto.language = user.language;
    dto.theme = user.theme;
    return dto;
  }
}
