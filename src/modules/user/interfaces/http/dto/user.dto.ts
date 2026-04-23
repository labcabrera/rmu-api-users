import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from 'src/modules/user/domain/aggregates/user';

export class UserDto {
  @ApiProperty({ description: 'Unique identifier of the user', required: true })
  @IsString()
  id: string;

  name: string;

  email: string;

  emailVerified: boolean;

  enabled: boolean;

  //   settings: UserSettingsDto;

  createdAt: Date;

  updatedAt: Date | null;

  static fromEntity(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.emailVerified = user.emailVerified;
    dto.enabled = user.enabled;
    return dto;
  }
}
