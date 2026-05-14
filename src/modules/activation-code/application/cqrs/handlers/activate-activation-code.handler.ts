import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError, ValidationError } from 'src/modules/shared/domain/errors/errors';
import { ActivationCode } from '../../../domain/aggregates/activation-code';
import { ActivationCodeRepository } from '../../ports/activation-code.repository';
import { ActivateActivationCodeCommand } from '../commands/activate-activation-code.command';
import { UserRepository } from 'src/modules/user/application/ports/user-repository';
import { IamUserPort } from 'src/modules/user/application/ports/iam-user.port';

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

    if (activationCode.expiresAt && activationCode.expiresAt.getTime() < Date.now()) {
      throw new ValidationError(`Activation code ${command.code} is expired`);
    }

    const iamGroups = await this.iamUserPort.findGroups();
    this.logger.verbose(`Found ${iamGroups.length} groups in Keycloak`);

    const groupsToAdd = activationCode.features
      .map(feature => iamGroups.find(g => g.name === feature))
      .filter((g): g is { id: string; name: string } => !!g);

    for (const group of groupsToAdd) {
      this.logger.verbose(`Adding user ${user.id} to group ${group.name} (${group.id})`);
      await this.iamUserPort.addUserToGroup(user.id, group.id);
    }

    activationCode.activate();
    return this.activationCodeRepository.update(activationCode.id, activationCode);
  }
}
