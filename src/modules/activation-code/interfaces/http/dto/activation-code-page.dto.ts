import { ApiProperty } from '@nestjs/swagger';
import { Page } from 'src/modules/shared/domain/entities/page';
import { PaginationDto } from 'src/modules/shared/interfaces/http/dto/page.dto';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationCodeDto } from './activation-code.dto';

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
