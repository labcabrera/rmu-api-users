import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { FRIENDSHIP_STATUSES } from '../../../domain/value-objects/friendship-status.vo';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo';

export class UpdateFriendshipDto {
  @ApiPropertyOptional({ description: 'Friendship status', enum: FRIENDSHIP_STATUSES, required: true })
  @IsIn(FRIENDSHIP_STATUSES)
  status: FriendshipStatus;
}
