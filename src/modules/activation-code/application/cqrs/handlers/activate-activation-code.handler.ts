import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { BadGatewayError, ConflictError, NotFoundError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { type IamUserPort, IAM_USER_PORT, type UserGroup } from '../../../../user/application/ports/iam-user.port.js';
import { type UserRepository, USER_REPOSITORY } from '../../../../user/application/ports/user-repository.port.js';
import { ActivationCode } from '../../../domain/aggregates/activation-code.js';
import { featureGroup } from '../../../domain/aggregates/activation-code-props.js';
import { type ActivationCodeRepository, ACTIVATION_CODE_REPOSITORY } from '../../ports/activation-code-repository.port.js';
import { ActivateActivationCodeCommand } from '../commands/activate-activation-code.command.js';

/** Redeems a single-use code: it is claimed atomically first, then the user is added to the Keycloak groups. */
@CommandHandler(ActivateActivationCodeCommand)
export class ActivateActivationCodeHandler implements ICommandHandler<ActivateActivationCodeCommand, ActivationCode> {
  private readonly logger = new Logger(ActivateActivationCodeHandler.name);

  constructor(
    @Inject(ACTIVATION_CODE_REPOSITORY) private readonly activationCodeRepository: ActivationCodeRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(IAM_USER_PORT) private readonly iamUserPort: IamUserPort,
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
    const groupsToAdd: UserGroup[] = [];
    for (const feature of activationCode.features) {
      const group = iamGroups.find(g => g.name === featureGroup(feature));
      // A missing group fails the redemption (and releases the code) instead of consuming it for nothing.
      if (!group) throw new BadGatewayError(`Keycloak has no group ${featureGroup(feature)} for feature ${feature}`);
      groupsToAdd.push(group);
    }
    for (const group of groupsToAdd) {
      this.logger.verbose(`Adding user ${userId} to group ${group.name} (${group.id})`);
      await this.iamUserPort.addUserToGroup(userId, group.id);
    }
  }
}
