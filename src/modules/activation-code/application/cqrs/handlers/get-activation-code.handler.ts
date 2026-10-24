import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { ActivationCodeRepository } from '../../ports/activation-code-repository.port.js';
import { GetActivationCodeQuery } from '../queries/get-activation-code.query.js';

@QueryHandler(GetActivationCodeQuery)
export class GetActivationCodeHandler implements IQueryHandler<GetActivationCodeQuery, ActivationCode> {
  constructor(@Inject(ActivationCodeRepository) private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(query: GetActivationCodeQuery): Promise<ActivationCode> {
    const activationCode = await this.activationCodeRepository.findById(query.id);
    if (!activationCode || activationCode.owner !== query.owner) {
      throw new NotFoundError('ActivationCode', query.id);
    }
    return activationCode;
  }
}
