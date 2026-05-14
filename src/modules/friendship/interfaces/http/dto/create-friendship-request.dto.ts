import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFriendshipRequestDto {
  @ApiProperty({ description: 'Name of the user receiving the friendship request', example: 'alice' })
  @IsString()
  addresseeName: string;

  @ApiPropertyOptional({ description: 'Optional request message', example: 'Want to connect?' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}
