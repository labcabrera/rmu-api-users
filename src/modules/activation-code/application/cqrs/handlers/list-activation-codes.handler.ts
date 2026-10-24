import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '../../../../shared/application/pagination/page.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { ActivationCodeRepository } from '../../ports/activation-code-repository.port.js';
import { ListActivationCodesQuery } from '../queries/list-activation-codes.query.js';
import { ForbiddenError } from '../../../../shared/domain/errors/errors.js';

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
