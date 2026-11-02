import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { FriendInvite } from '../../../domain/aggregates/friend-invite.js';

export class FriendInviteDto {
  @ApiProperty({ description: 'Unique identifier of the invite', example: '2d7f1e0c-8c5d-4e91-9c1b-4e0c0cf7211e' })
  id: string;

  @ApiProperty({ description: 'Id of the user that invites', example: 'b9d2b52d-5b4d-4ab7-a59d-93bb67e32ce1' })
  inviterId: string;

  @ApiProperty({ description: 'Display name of the user that invites', example: 'alice' })
  inviterName: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', description: 'When the link stops working (7 days after its creation)' })
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'Token of the link. Only in the answer of the creation: it is not stored and cannot be read again',
    example: 'q3Yt0m3S1x5j1vXo2pQ9cN8bL4aK7dF6',
  })
  token?: string;

  static fromEntity(invite: FriendInvite, token?: string): FriendInviteDto {
    const dto = new FriendInviteDto();
    dto.id = invite.id;
    dto.inviterId = invite.inviterId;
    dto.inviterName = invite.inviterName;
    dto.createdAt = invite.createdAt;
    dto.expiresAt = invite.expiresAt;
    if (token !== undefined) dto.token = token;
    return dto;
  }
}

/** The token goes in the body, out of the access logs (spec 070, decision 6). */
export class FriendInviteTokenDto {
  @ApiProperty({ description: 'Token of the invite link', example: 'q3Yt0m3S1x5j1vXo2pQ9cN8bL4aK7dF6' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{16,64}$/)
  token: string;
}
