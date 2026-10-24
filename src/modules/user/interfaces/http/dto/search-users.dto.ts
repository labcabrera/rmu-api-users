/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { SEARCH_USERS_MAX_SIZE } from '../../../application/cqrs/handlers/search-users.handler.js';

export class SearchUsersDto {
  @ApiProperty({ description: 'Display name prefix (case-insensitive)', example: 'ali' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({ description: 'Page', minimum: 0, default: 0 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? 0 : parseInt(value, 10)))
  @IsInt()
  @Min(0)
  page: number = 0;

  @ApiPropertyOptional({ description: 'Size', minimum: 1, maximum: SEARCH_USERS_MAX_SIZE, default: 10 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? 10 : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(SEARCH_USERS_MAX_SIZE)
  size: number = 10;
}
