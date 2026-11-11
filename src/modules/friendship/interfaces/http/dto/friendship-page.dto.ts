import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../../../shared/application/pagination/page.js';
import { PaginationDto } from '../../../../shared/interfaces/http/dto/page.dto.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { FriendshipDto } from './friendship.dto.js';

export class FriendshipPageDto {
  @ApiProperty({ type: [FriendshipDto] })
  content: FriendshipDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  static fromPage(page: Page<Friendship>): FriendshipPageDto {
    const dto = new FriendshipPageDto();
    dto.content = page.content.map(friendship => FriendshipDto.fromEntity(friendship));
    dto.pagination = page.pagination;
    return dto;
  }
}
