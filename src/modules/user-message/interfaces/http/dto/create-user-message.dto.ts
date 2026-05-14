import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { MESSAGE_TYPES } from '../../../domain/value-objects/message-type.vo';
import type { MessageType } from '../../../domain/value-objects/message-type.vo';

export class CreateUserMessageDto {
  @ApiProperty({ description: 'Message text', example: 'Your activation code has been redeemed' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ description: 'Recipient user id', example: 'b9d2b52d-5b4d-4ab7-a59d-93bb67e32ce1' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'Message type', enum: MESSAGE_TYPES, example: 'info' })
  @IsIn(MESSAGE_TYPES)
  type: MessageType;
}
