import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '../../../../shared/application/pagination/page.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { ActivationCodeGuardAdapter } from '../../../infrastructure/security/activation-code-guard.adapter.js';
import { ListActivationCodesQuery } from '../queries/list-activation-codes.query.js';

@QueryHandler(ListActivationCodesQuery)
export class ListActivationCodesHandler implements IQueryHandler<ListActivationCodesQuery, Page<ActivationCode>> {
  constructor(
    @Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository,
    @Inject(ActivationCodeGuardAdapter) private readonly guard: ActivationCodeGuardAdapter,
  ) {}

  async execute(query: ListActivationCodesQuery): Promise<Page<ActivationCode>> {
    this.guard.checkList(query.roles);
    return this.activationCodeRepository.findByRsql(query.q, query.page, query.size);
  }
}
