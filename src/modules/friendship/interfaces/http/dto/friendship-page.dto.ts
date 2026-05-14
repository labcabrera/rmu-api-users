import { ApiProperty } from '@nestjs/swagger';
import { Page } from 'src/modules/shared/domain/entities/page';
import { PaginationDto } from 'src/modules/shared/interfaces/http/dto/page.dto';
import { Friendship } from '../../../domain/aggregates/friendship';
import { FriendshipDto } from './friendship.dto';

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
