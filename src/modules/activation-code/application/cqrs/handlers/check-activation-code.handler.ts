import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConflictError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { CheckActivationCodeQuery } from '../queries/check-activation-code.query.js';

/** Tells whether a code can be redeemed. The lookup is an exact, parameterized match on the code value. */
@QueryHandler(CheckActivationCodeQuery)
export class CheckActivationCodeHandler implements IQueryHandler<CheckActivationCodeQuery, ActivationCode> {
  constructor(@Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository) {}

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
