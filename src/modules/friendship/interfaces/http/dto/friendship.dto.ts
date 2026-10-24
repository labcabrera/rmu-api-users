import { ApiProperty } from '@nestjs/swagger';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { FRIENDSHIP_STATUSES, type FriendshipStatus } from '../../../domain/value-objects/friendship-status.vo.js';

export class FriendshipDto {
  @ApiProperty({ description: 'Unique identifier of the friendship', example: '2d7f1e0c-8c5d-4e91-9c1b-4e0c0cf7211e' })
  id: string;

  @ApiProperty({ description: 'Id of the user that sent the request', example: 'b9d2b52d-5b4d-4ab7-a59d-93bb67e32ce1' })
  requesterId: string;

  @ApiProperty({ description: 'Display name of the requester when the request was sent', example: 'alice' })
  requesterName: string;

  @ApiProperty({ description: 'Id of the user that receives the request', example: '6beaa3fb-7e2a-4868-b926-89cf9fd9e71a' })
  addresseeId: string;

  @ApiProperty({ description: 'Display name of the addressee when the request was sent', example: 'bob' })
  addresseeName: string;

  @ApiProperty({
    description: 'pending -> accepted | rejected | blocked, accepted -> blocked; a new request reopens a rejected one',
    enum: FRIENDSHIP_STATUSES,
    example: 'pending',
  })
  status: FriendshipStatus;

  @ApiProperty({ type: String, description: 'Message of the request', example: 'Shall we play?', nullable: true })
  message: string | null;

  @ApiProperty({ description: 'Creation timestamp', type: String, format: 'date-time', example: '2026-05-14T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last change of status', type: String, format: 'date-time', nullable: true, example: null })
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
