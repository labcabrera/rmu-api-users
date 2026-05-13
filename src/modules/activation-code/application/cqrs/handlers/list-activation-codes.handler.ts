import { Inject } from '@nestjs/common';
import { QueryCriteria } from 'src/modules/shared/application/criteria/query-criteria';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from 'src/modules/shared/domain/entities/page';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import type { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { ListActivationCodesQuery } from '../queries/list-activation-codes.query';

@QueryHandler(ListActivationCodesQuery)
export class ListActivationCodesHandler implements IQueryHandler<ListActivationCodesQuery, Page<ActivationCode>> {
  constructor(@Inject('ActivationCodeRepository') private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(query: ListActivationCodesQuery): Promise<Page<ActivationCode>> {
    const filter = query.owner ? QueryCriteria.eq('owner', query.owner) : undefined;
    return this.activationCodeRepository.findByRsql(query.q, query.page, query.size, filter);
  }
}
