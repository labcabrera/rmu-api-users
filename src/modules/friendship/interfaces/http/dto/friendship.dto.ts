import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import type { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo.js';

export class FriendshipDto {
  @ApiProperty({ description: 'Unique identifier of the friendship', required: true })
  @IsString()
  id: string;

  requesterId: string;
  requesterName?: string;
  addresseeId?: string;

  addresseeName: string;

  status: FriendshipStatus;

  message: string | null;

  createdAt: Date;

  updatedAt: Date | null;

  @ApiProperty({ description: 'Version of optimistic concurrency: send it back in the PATCH to detect a concurrent change', example: 0 })
  version: number;

  static fromEntity(friendship: Friendship): FriendshipDto {
    const dto = new FriendshipDto();
    dto.id = friendship.id;
    dto.requesterId = friendship.requesterId;
    dto.requesterName = friendship.requesterName;
    dto.addresseeId = friendship.addresseeId;
    dto.addresseeName = friendship.addresseeName;
    dto.status = friendship.status;
    dto.message = friendship.message;
    dto.createdAt = friendship.createdAt;
    dto.updatedAt = friendship.updatedAt;
    dto.version = friendship.version;
    return dto;
  }
}
