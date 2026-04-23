import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserStatus } from 'src/modules/user/domain/value-objects/user-status.vo';

export class UserDto {
  @ApiProperty({ description: 'Unique identifier of the user', required: true })
  @IsString()
  id: string;

  name: string;

  email: string;

  emailVerified: boolean;

  status: UserStatus;
  //   settings: UserSettingsDto;

  createdAt: Date;

  updatedAt: Date | null;

  static fromEntity(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.emailVerified = user.emailVerified;
    dto.status = user.status;
    return dto;
  }
}
