import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { FRIENDSHIP_STATUSES } from '../../../domain/value-objects/friendship-status.vo';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo';

export class UpdateFriendshipDto {
  @ApiPropertyOptional({ description: 'Friendship status', enum: FRIENDSHIP_STATUSES })
  @IsOptional()
  @IsIn(FRIENDSHIP_STATUSES)
  status?: FriendshipStatus;

  @ApiPropertyOptional({ description: 'Optional request message', example: 'Want to connect?' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}
