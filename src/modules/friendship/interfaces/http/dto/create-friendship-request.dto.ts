import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFriendshipRequestDto {
  @ApiProperty({
    description:
      'Exact display name (case-insensitive) of the user receiving the request; emails and Keycloak usernames find nobody (spec 070)',
    example: 'alice',
  })
  @IsString()
  @MaxLength(254)
  addresseeName: string;

  @ApiPropertyOptional({ type: String, description: 'Optional request message', example: 'Want to connect?' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}
