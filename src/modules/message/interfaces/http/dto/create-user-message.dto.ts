import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { MESSAGE_TYPES } from '../../../domain/value-objects/message-type.vo';
import type { MessageType } from '../../../domain/value-objects/message-type.vo';

export class CreateUserMessageDto {
  @ApiProperty({ description: 'Message text', example: 'Your activation code has been redeemed' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ description: 'Message type', enum: MESSAGE_TYPES, example: 'info' })
  @IsIn(MESSAGE_TYPES)
  type: MessageType;
}
