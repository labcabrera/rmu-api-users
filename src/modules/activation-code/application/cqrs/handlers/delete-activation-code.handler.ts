import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { DeleteActivationCodeCommand } from '../commands/delete-activation-code.command.js';

@CommandHandler(DeleteActivationCodeCommand)
export class DeleteActivationCodeHandler implements ICommandHandler<DeleteActivationCodeCommand, ActivationCode> {
  constructor(@Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository) {}

  async execute(command: DeleteActivationCodeCommand): Promise<ActivationCode> {
    const activationCode = await this.activationCodeRepository.findById(command.id);
    if (!activationCode || activationCode.owner !== command.owner) {
      throw new NotFoundError('ActivationCode', command.id);
    }
    const deleted = await this.activationCodeRepository.deleteById(command.id);
    if (!deleted) {
      throw new NotFoundError('ActivationCode', command.id);
    }
    return deleted;
  }
}
