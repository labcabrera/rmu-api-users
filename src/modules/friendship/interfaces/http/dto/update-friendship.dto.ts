import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { FRIENDSHIP_STATUSES } from '../../../domain/value-objects/friendship-status.vo.js';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo.js';

export class UpdateFriendshipDto {
  @ApiPropertyOptional({ type: String, description: 'Friendship status', enum: FRIENDSHIP_STATUSES, required: true })
  @IsIn(FRIENDSHIP_STATUSES)
  status: FriendshipStatus;

  @ApiPropertyOptional({ description: 'Version the client read (from the GET); a different stored version is a 409', example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  version?: number;
}
