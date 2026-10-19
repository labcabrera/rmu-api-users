import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConflictError, ValidationError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { CheckActivationCodeQuery } from '../queries/check-activation-code.query';

/** Tells whether a code can be redeemed. The lookup is an exact, parameterized match on the code value. */
@QueryHandler(CheckActivationCodeQuery)
export class CheckActivationCodeHandler implements IQueryHandler<CheckActivationCodeQuery, ActivationCode> {
  constructor(@Inject(ActivationCodeRepository) private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(query: CheckActivationCodeQuery): Promise<ActivationCode> {
    const activationCode = await this.activationCodeRepository.findByCode(query.code);
    if (!activationCode) {
      throw new ValidationError('Invalid activation code');
    }
    if (activationCode.isUsed()) {
      throw new ConflictError('Activation code has already been used');
    }
    if (activationCode.isExpired()) {
      throw new ValidationError('Activation code is expired');
    }
    return activationCode;
  }
}
