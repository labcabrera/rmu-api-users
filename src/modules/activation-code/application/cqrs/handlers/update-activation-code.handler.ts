import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { UpdateActivationCodeCommand } from '../commands/update-activation-code.command.js';

@CommandHandler(UpdateActivationCodeCommand)
export class UpdateActivationCodeHandler implements ICommandHandler<UpdateActivationCodeCommand, ActivationCode> {
  constructor(@Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(command: UpdateActivationCodeCommand): Promise<ActivationCode> {
    const activationCode = await this.activationCodeRepository.findById(command.id);
    if (!activationCode || activationCode.owner !== command.owner) {
      throw new NotFoundError('ActivationCode', command.id);
    }
    activationCode.checkVersion(command.expectedVersion);
    activationCode.update({
      code: command.code,
      features: command.features,
      expiresAt: command.expiresAt,
      activatedAt: command.activatedAt,
    });
    if (!activationCode.hasChanges()) return activationCode;
    return this.activationCodeRepository.update(activationCode);
  }
}
