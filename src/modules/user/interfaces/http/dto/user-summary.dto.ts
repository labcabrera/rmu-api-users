import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Page } from 'src/modules/shared/domain/entities/page';
import { PaginationDto } from 'src/modules/shared/interfaces/http/dto/page.dto';
import { UserSummary } from 'src/modules/user/application/models/user-summary';

export class UserSummaryDto {
  @ApiProperty({ description: 'Unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'Display name of the user', example: 'alice' })
  name: string;

  @ApiPropertyOptional({ description: 'URL to the user profile image', nullable: true })
  imageUrl: string | null;

  static fromModel(summary: UserSummary): UserSummaryDto {
    const dto = new UserSummaryDto();
    dto.id = summary.id;
    dto.name = summary.name;
    dto.imageUrl = summary.imageUrl;
    return dto;
  }
}

export class UserSummaryPageDto {
  @ApiProperty({ type: [UserSummaryDto] })
  content: UserSummaryDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  static fromPage(page: Page<UserSummary>): UserSummaryPageDto {
    const dto = new UserSummaryPageDto();
    dto.content = page.content.map(summary => UserSummaryDto.fromModel(summary));
    dto.pagination = page.pagination;
    return dto;
  }
}
