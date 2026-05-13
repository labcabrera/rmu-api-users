import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationFeature } from '../../../domain/aggregates/activation-code-props';
import type { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { UpdateActivationCodeCommand } from '../commands/update-activation-code.command';

@CommandHandler(UpdateActivationCodeCommand)
export class UpdateActivationCodeHandler implements ICommandHandler<UpdateActivationCodeCommand, ActivationCode> {
  constructor(@Inject('ActivationCodeRepository') private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(command: UpdateActivationCodeCommand): Promise<ActivationCode> {
    const activationCode = await this.activationCodeRepository.findById(command.id);
    if (!activationCode || activationCode.owner !== command.owner) {
      throw new NotFoundError('ActivationCode', command.id);
    }
    activationCode.update({
      code: command.code,
      features: command.features as ActivationFeature[] | undefined,
      expiresAt: command.expiresAt,
      activatedAt: command.activatedAt,
    });
    return this.activationCodeRepository.update(activationCode.id, activationCode);
  }
}
