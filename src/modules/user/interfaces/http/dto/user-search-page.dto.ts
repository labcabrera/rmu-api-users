import { ApiProperty } from '@nestjs/swagger';
import { Page } from 'src/modules/shared/domain/entities/page';
import { PaginationDto } from 'src/modules/shared/interfaces/http/dto/page.dto';
import { UserApiResponse } from '../../../application/ports/user-search.port';
import { UserSearchResultDto } from './user-search-result.dto';

export class UserSearchPageDto {
  @ApiProperty({ type: [UserSearchResultDto] })
  content: UserSearchResultDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  static fromPage(page: Page<UserApiResponse>): UserSearchPageDto {
    const dto = new UserSearchPageDto();
    dto.content = page.content.map(user => UserSearchResultDto.fromResponse(user));
    dto.pagination = page.pagination;
    return dto;
  }
}
