import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFriendshipRequestDto {
  @ApiProperty({ description: 'Display name (or Keycloak username/email) of the user receiving the request', example: 'alice' })
  @IsString()
  @MaxLength(254)
  addresseeName: string;

  @ApiPropertyOptional({ description: 'Id of the user receiving the friendship request', example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsOptional()
  @IsString()
  addresseeId?: string;

  @ApiPropertyOptional({ type: String, description: 'Optional request message', example: 'Want to connect?' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}
