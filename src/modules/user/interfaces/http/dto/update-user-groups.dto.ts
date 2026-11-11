import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn } from 'class-validator';
import { MANAGED_GROUPS, type ManagedGroup } from '../../../../shared/domain/entities/user-roles.js';

export class UpdateUserGroupsDto {
  @ApiProperty({
    description: 'Managed realm groups the user must belong to; the managed groups not listed are removed',
    enum: MANAGED_GROUPS,
    type: [String],
    example: ['rmu-user', 'rmu-core-law'],
  })
  @IsArray()
  @ArrayUnique()
  @IsIn(MANAGED_GROUPS, { each: true })
  groups: ManagedGroup[];
}
