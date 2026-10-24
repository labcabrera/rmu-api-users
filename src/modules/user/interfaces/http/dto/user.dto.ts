import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { User } from '../../../domain/aggregates/user';
import { UserSettingsDto } from './user-settings.dto';

export class UserDto {
  @ApiProperty({ description: 'Unique identifier of the user', required: true })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Display name of the user', example: 'alice' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email of the user', example: 'alice@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Whether the email address has been verified', type: Boolean })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ description: 'Whether the user is enabled', type: Boolean })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'List of feature flags enabled for the user', type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'User settings', type: UserSettingsDto })
  @ValidateNested()
  @Type(() => UserSettingsDto)
  settings: UserSettingsDto;

  @ApiPropertyOptional({ type: String, description: 'URL to the user profile image', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiProperty({ description: 'How the user signs in: local (username/password) or the identity provider alias', example: 'local' })
  identityProvider: string;

  @ApiPropertyOptional({ type: String, description: 'Given name from the identity provider', nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ type: String, description: 'Family name from the identity provider', nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ description: 'Last login (refreshed at most once per hour)', type: String, format: 'date-time', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp', type: String, format: 'date-time' })
  @IsOptional()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', type: String, format: 'date-time', required: false })
  @IsOptional()
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
    dto.imageUrl = user.imageUrl;
    dto.identityProvider = user.identityProvider;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
