import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { GetActivationCodeQuery } from '../queries/get-activation-code.query';

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
