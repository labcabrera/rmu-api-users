import { ApiProperty } from '@nestjs/swagger';
import { CollectionStatsDto } from './collection-stats.dto.js';

export class UserStatsDto extends CollectionStatsDto {
  @ApiProperty({ description: 'Users who signed in during the last 30 days', example: 4 })
  active: number;

  @ApiProperty({ description: 'Users created this month (UTC)', example: 1 })
  newThisMonth: number;
}

export class ActivationCodeStatsDto {
  @ApiProperty({ example: 20 })
  total: number;

  @ApiProperty({ description: 'Not used and not expired', example: 12 })
  free: number;

  @ApiProperty({ description: 'Redeemed', example: 6 })
  used: number;

  @ApiProperty({ description: 'Not used and past their expiry date', example: 2 })
  expired: number;
}

export class UsersApiStatsDto {
  @ApiProperty({ type: UserStatsDto })
  users: UserStatsDto;

  @ApiProperty({ type: ActivationCodeStatsDto })
  activationCodes: ActivationCodeStatsDto;
}
