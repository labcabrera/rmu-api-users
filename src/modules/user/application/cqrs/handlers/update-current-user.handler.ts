import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError, ValidationError } from 'src/modules/shared/domain/errors/errors';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';
import { IamUserPort, UserApiResponse } from '../../ports/iam-user.port';
import { UserRepository } from '../../ports/user-repository';
import { UpdateCurrentUserCommand } from '../commands/update-current-user.command';

@CommandHandler(UpdateCurrentUserCommand)
export class UpdateCurrentUserHandler implements ICommandHandler<UpdateCurrentUserCommand, User> {
  private readonly logger = new Logger(UpdateCurrentUserHandler.name);

  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(IamUserPort) private readonly iamUserPort: IamUserPort,
  ) {}

  async execute(command: UpdateCurrentUserCommand): Promise<User> {
    this.ensureChanges(command);

    const iamUser = await this.iamUserPort.findById(command.userId);
    if (!iamUser) {
      this.logger.warn(`User ${command.userId} not found in Keycloak`);
      throw new NotFoundError('User', command.userId);
    }

    if (command.name !== undefined && command.name !== iamUser.username) {
      await this.iamUserPort.updateName(command.userId, command.name);
    }

    const user = await this.findOrCreateUser(command, iamUser);
    user.update({
      name: command.name ?? iamUser.username,
      email: iamUser.email,
      emailVerified: iamUser.emailVerified || false,
      enabled: iamUser.enabled,
      features: command.roles,
      settings: command.settings,
      imageUrl: command.imageUrl,
    });

    return this.userRepository.update(user.id, user);
  }

  private ensureChanges(command: UpdateCurrentUserCommand): void {
    if (command.name === undefined && command.settings === undefined && command.imageUrl === undefined) {
      throw new ValidationError('At least one of name, settings or imageUrl must be provided');
    }
    if (command.name !== undefined && typeof command.name !== 'string') {
      throw new ValidationError('User name must be a string');
    }
    if (command.name !== undefined && command.name.trim().length === 0) {
      throw new ValidationError('User name must not be empty');
    }
    if (command.imageUrl !== undefined && command.imageUrl !== null && typeof command.imageUrl !== 'string') {
      throw new ValidationError('Image URL must be a string or null');
    }
    if (command.settings && !['metric', 'imperial'].includes(command.settings.measurementSystem)) {
      throw new ValidationError('Measurement system must be metric or imperial');
    }
  }

  private async findOrCreateUser(command: UpdateCurrentUserCommand, iamUser: UserApiResponse): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (user) {
      return user;
    }

    return this.userRepository.save(
      User.create({
        id: iamUser.id,
        name: iamUser.username,
        email: iamUser.email,
        emailVerified: iamUser.emailVerified || false,
        enabled: iamUser.enabled,
        features: command.roles,
        settings: UserSettings.default(),
        imageUrl: null,
      }),
    );
  }
}
