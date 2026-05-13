import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import type { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { CreateActivationCodeCommand } from '../commands/create-activation-code.command';

@CommandHandler(CreateActivationCodeCommand)
export class CreateActivationCodeHandler implements ICommandHandler<CreateActivationCodeCommand, ActivationCode> {
  constructor(@Inject('ActivationCodeRepository') private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(command: CreateActivationCodeCommand): Promise<ActivationCode> {
    const existing = await this.activationCodeRepository.findByCode(command.code, command.owner);
    if (existing) {
      throw new ConflictError(`Activation code ${command.code} already exists`);
    }
    const activationCode = ActivationCode.create({
      code: command.code,
      owner: command.owner,
      features: command.features,
      expiresAt: command.expiresAt,
    });
    return this.activationCodeRepository.save(activationCode);
  }
}
