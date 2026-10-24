import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../../../shared/domain/entities/page';
import { PaginationDto } from '../../../../shared/interfaces/http/dto/page.dto';
import { User } from '../../../domain/aggregates/user';
import { UserDto } from './user.dto';

export class UserPageDto {
  @ApiProperty({ type: [UserDto] })
  content: UserDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  static fromPage(page: Page<User>): UserPageDto {
    const dto = new UserPageDto();
    dto.content = page.content.map(user => UserDto.fromEntity(user));
    dto.pagination = page.pagination;
    return dto;
  }
}
