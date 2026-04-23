import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserSettingsDto } from './user-settings.dto';

export class UserDto {
  @ApiProperty({ description: 'Unique identifier of the user', required: true })
  @IsString()
  id: string;

  name: string;

  email: string;

  emailVerified: boolean;

  enabled: boolean;

  features: string[];

  settings: UserSettingsDto;

  createdAt: Date;

  updatedAt: Date | null;

  static fromEntity(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.emailVerified = user.emailVerified;
    dto.enabled = user.enabled;
    dto.features = user.features;
    dto.settings = UserSettingsDto.fromEntity(user.settings);
    return dto;
  }
}
