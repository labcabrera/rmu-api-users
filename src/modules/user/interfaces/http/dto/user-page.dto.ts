import { ApiProperty } from '@nestjs/swagger';
import { Page } from 'src/modules/shared/domain/entities/page';
import { PaginationDto } from 'src/modules/shared/interfaces/http/dto/page.dto';
import { User } from 'src/modules/user/domain/aggregates/user';
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
