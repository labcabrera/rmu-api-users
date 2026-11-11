import { ApiProperty } from '@nestjs/swagger';
import { Page } from '../../../../shared/application/pagination/page.js';
import { PaginationDto } from '../../../../shared/interfaces/http/dto/page.dto.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { ActivationCodeDto } from './activation-code.dto.js';

export class ActivationCodePageDto {
  @ApiProperty({ type: [ActivationCodeDto] })
  content: ActivationCodeDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  static fromPage(page: Page<ActivationCode>): ActivationCodePageDto {
    const dto = new ActivationCodePageDto();
    dto.content = page.content.map(activationCode => ActivationCodeDto.fromEntity(activationCode));
    dto.pagination = page.pagination;
    return dto;
  }
}
