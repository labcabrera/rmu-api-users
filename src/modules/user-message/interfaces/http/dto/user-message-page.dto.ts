import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../../../shared/application/pagination/page.js';
import { PaginationDto } from '../../../../shared/interfaces/http/dto/page.dto.js';
import { UserMessage } from '../../../domain/aggregates/user-message.js';
import { UserMessageDto } from './user-message.dto.js';

export class UserMessagePageDto {
  @ApiProperty({ type: [UserMessageDto] })
  content: UserMessageDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  static fromPage(page: Page<UserMessage>): UserMessagePageDto {
    const dto = new UserMessagePageDto();
    dto.content = page.content.map(message => UserMessageDto.fromEntity(message));
    dto.pagination = page.pagination;
    return dto;
  }
}
