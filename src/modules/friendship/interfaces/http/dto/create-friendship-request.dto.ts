import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFriendshipRequestDto {
  @ApiProperty({ description: 'User id receiving the friendship request', example: 'user-123' })
  @IsString()
  addresseeId: string;

  @ApiPropertyOptional({ description: 'Optional request message', example: 'Want to connect?' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}
