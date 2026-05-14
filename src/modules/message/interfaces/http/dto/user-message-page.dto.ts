import { ApiProperty } from '@nestjs/swagger';
import { Page } from 'src/modules/shared/domain/entities/page';
import { PaginationDto } from 'src/modules/shared/interfaces/http/dto/page.dto';
import { UserMessage } from '../../../domain/aggregates/user-message';
import { UserMessageDto } from './user-message.dto';

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
