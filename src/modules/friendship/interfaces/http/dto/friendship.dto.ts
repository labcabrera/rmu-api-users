import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Friendship } from '../../../domain/aggregates/friendship';
import { FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo';

export class FriendshipDto {
  @ApiProperty({ description: 'Unique identifier of the friendship', required: true })
  @IsString()
  id: string;

  requesterId: string;

  addresseeName: string;

  status: FriendshipStatus;

  message: string | null;

  createdAt: Date;

  updatedAt: Date | null;

  static fromEntity(friendship: Friendship): FriendshipDto {
    const dto = new FriendshipDto();
    dto.id = friendship.id;
    dto.requesterId = friendship.requesterId;
    dto.addresseeName = friendship.addresseeName;
    dto.status = friendship.status;
    dto.message = friendship.message;
    dto.createdAt = friendship.createdAt;
    dto.updatedAt = friendship.updatedAt;
    return dto;
  }
}
