import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { ActivationCodeGuardAdapter } from '../../../infrastructure/security/activation-code-guard.adapter.js';
import { GetActivationCodeQuery } from '../queries/get-activation-code.query.js';

@QueryHandler(GetActivationCodeQuery)
export class GetActivationCodeHandler implements IQueryHandler<GetActivationCodeQuery, ActivationCode> {
  constructor(
    @Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository,
    @Inject(ActivationCodeGuardAdapter) private readonly guard: ActivationCodeGuardAdapter,
  ) {}

  async execute(query: GetActivationCodeQuery): Promise<ActivationCode> {
    this.guard.checkRead(null, query.userId, query.roles);
    const activationCode = await this.activationCodeRepository.findById(query.id);
    if (!activationCode) {
      throw new NotFoundError('ActivationCode', query.id);
    }
    return activationCode;
  }
}
