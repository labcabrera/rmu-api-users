import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError, ValidationError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import type { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { ActivateActivationCodeCommand } from '../commands/activate-activation-code.command';

@CommandHandler(ActivateActivationCodeCommand)
export class ActivateActivationCodeHandler implements ICommandHandler<ActivateActivationCodeCommand, ActivationCode> {
  constructor(@Inject('ActivationCodeRepository') private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(command: ActivateActivationCodeCommand): Promise<ActivationCode> {
    const activationCode = await this.activationCodeRepository.findByCode(command.code, command.owner);
    if (!activationCode) {
      throw new NotFoundError('ActivationCode', command.code);
    }
    if (activationCode.expiresAt.getTime() < Date.now()) {
      throw new ValidationError(`Activation code ${command.code} is expired`);
    }
    activationCode.activate();
    return this.activationCodeRepository.update(activationCode.id, activationCode);
  }
}
