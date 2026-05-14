import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserMessage } from '../../../domain/aggregates/user-message';
import { MESSAGE_TYPES } from '../../../domain/value-objects/message-type.vo';
import type { MessageType } from '../../../domain/value-objects/message-type.vo';

export class UserMessageDto {
  @ApiProperty({ description: 'Unique identifier of the message', example: '2d7f1e0c-8c5d-4e91-9c1b-4e0c0cf7211e' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Identifier of the message owner', example: 'b9d2b52d-5b4d-4ab7-a59d-93bb67e32ce1' })
  userId: string;

  @ApiProperty({ description: 'Identifier of the message sender', example: 'a1b2c3d4-1234-5678-9abc-def012345678' })
  from: string;

  @ApiProperty({ description: 'Message text', example: 'Your activation code has been redeemed' })
  message: string;

  @ApiProperty({ description: 'Message type', enum: MESSAGE_TYPES, example: 'info' })
  type: MessageType;

  @ApiPropertyOptional({
    description: 'Date when the message was read. Null means unread',
    example: '2026-05-14T10:30:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  readed: Date | null;

  @ApiProperty({
    description: 'Date when the message was created',
    example: '2026-05-14T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Date when the message was last updated',
    example: '2026-05-14T10:30:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  updatedAt: Date | null;

  static fromEntity(message: UserMessage): UserMessageDto {
    const dto = new UserMessageDto();
    dto.id = message.id;
    dto.userId = message.userId;
    dto.from = message.from;
    dto.message = message.message;
    dto.type = message.type;
    dto.readed = message.readed;
    dto.createdAt = message.createdAt;
    dto.updatedAt = message.updatedAt;
    return dto;
  }
}
