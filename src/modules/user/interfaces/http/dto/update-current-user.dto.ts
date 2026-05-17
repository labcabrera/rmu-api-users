import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateCurrentUserSettingsDto {
  @ApiPropertyOptional({ description: 'Measurement system used by the user', enum: ['metric', 'imperial'] })
  @IsOptional()
  @IsIn(['metric', 'imperial'])
  measurementSystem?: 'metric' | 'imperial';
}

export class UpdateCurrentUserDto {
  @ApiPropertyOptional({ description: 'Display name of the user', example: 'alice' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User settings', type: UpdateCurrentUserSettingsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateCurrentUserSettingsDto)
  settings?: UpdateCurrentUserSettingsDto;

  @ApiPropertyOptional({ description: 'URL to the user profile image', nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
