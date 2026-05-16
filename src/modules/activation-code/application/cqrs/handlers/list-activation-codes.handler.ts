import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { ListActivationCodesQuery } from '../queries/list-activation-codes.query';
import { ForbiddenError } from 'src/modules/shared/domain/errors/errors';

@QueryHandler(ListActivationCodesQuery)
export class ListActivationCodesHandler implements IQueryHandler<ListActivationCodesQuery, Page<ActivationCode>> {
  constructor(@Inject(ActivationCodeRepository) private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(query: ListActivationCodesQuery): Promise<Page<ActivationCode>> {
    if (query.roles.includes('rmu-admin')) {
      return this.activationCodeRepository.findByRsql(query.q, query.page, query.size);
    }
    throw new ForbiddenError('You do not have permission to list activation codes');
  }
}
