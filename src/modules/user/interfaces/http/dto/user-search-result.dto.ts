import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserApiResponse } from '../../../application/ports/user-search.port';

export class UserSearchResultDto {
  @ApiProperty({ description: 'Unique identifier of the user', required: true })
  @IsString()
  id: string;

  username: string;

  email: string;

  emailVerified: boolean;

  enabled: boolean;

  static fromResponse(user: UserApiResponse): UserSearchResultDto {
    const dto = new UserSearchResultDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.email = user.email;
    dto.emailVerified = user.emailVerified;
    dto.enabled = user.enabled;
    return dto;
  }
}
