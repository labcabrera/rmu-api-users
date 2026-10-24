import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictError, NotFoundError, ValidationError } from '../../../../shared/domain/errors/errors';
import { IamUserPort, UserGroup } from '../../../../user/application/ports/iam-user.port';
import { UserRepository } from '../../../../user/application/ports/user-repository.port';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationCodeRepository } from '../../ports/activation-code-repository.port';
import { ActivateActivationCodeCommand } from '../commands/activate-activation-code.command';

/** Redeems a single-use code: it is claimed atomically first, then the user is added to the Keycloak groups. */
@CommandHandler(ActivateActivationCodeCommand)
export class ActivateActivationCodeHandler implements ICommandHandler<ActivateActivationCodeCommand, ActivationCode> {
  private readonly logger = new Logger(ActivateActivationCodeHandler.name);

  constructor(
    @Inject(ActivationCodeRepository) private readonly activationCodeRepository: ActivationCodeRepository,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(IamUserPort) private readonly iamUserPort: IamUserPort,
  ) {}

  async execute(command: ActivateActivationCodeCommand): Promise<ActivationCode> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundError('User', command.userId);
    }

    const activationCode = await this.activationCodeRepository.findByCode(command.code);
    if (!activationCode) {
      throw new NotFoundError('ActivationCode', command.code);
    }
    if (activationCode.isUsed()) {
      throw new ConflictError(`Activation code ${command.code} has already been used`);
    }
    if (activationCode.isExpired()) {
      throw new ValidationError(`Activation code ${command.code} is expired`);
    }

    const claimed = await this.activationCodeRepository.markActivated(activationCode.id, user.id, new Date());
    if (!claimed) {
      throw new ConflictError(`Activation code ${command.code} has already been used`);
    }

    try {
      await this.assignGroups(claimed, user.id);
    } catch (err) {
      this.logger.error(`Group assignment failed for code ${claimed.id}; releasing it`, err);
      await this.activationCodeRepository.clearActivation(claimed.id, user.id);
      throw err;
    }
    return claimed;
  }

  private async assignGroups(activationCode: ActivationCode, userId: string): Promise<void> {
    const iamGroups = await this.iamUserPort.findGroups();
    const groupsToAdd = activationCode.features.map(feature => iamGroups.find(g => g.name === feature)).filter((g): g is UserGroup => !!g);
    for (const group of groupsToAdd) {
      this.logger.verbose(`Adding user ${userId} to group ${group.name} (${group.id})`);
      await this.iamUserPort.addUserToGroup(userId, group.id);
    }
  }
}
