import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictError, NotFoundError, ValidationError } from 'src/modules/shared/domain/errors/errors';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserUpdatedEvent } from 'src/modules/user/domain/events/user-events';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, DISPLAY_NAME_PATTERN } from 'src/modules/user/domain/services/display-name';
import { UserEventBusPort } from '../../ports/user-event-bus.port';
import { UserRepository } from '../../ports/user-repository';
import { UpdateCurrentUserCommand } from '../commands/update-current-user.command';

/** Updates the RMU profile only. The Keycloak account (username included) is never touched. */
@CommandHandler(UpdateCurrentUserCommand)
export class UpdateCurrentUserHandler implements ICommandHandler<UpdateCurrentUserCommand, User> {
  private readonly logger = new Logger(UpdateCurrentUserHandler.name);

  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(UserEventBusPort) private readonly userEventBus: UserEventBusPort,
  ) {}

  async execute(command: UpdateCurrentUserCommand): Promise<User> {
    const name = this.validate(command);

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundError('User', command.userId);
    }

    if (name !== undefined && name !== user.name && (await this.userRepository.existsByName(name, user.id))) {
      throw new ConflictError(`User name ${name} is already in use`);
    }

    user.update({
      name,
      settings: command.settings,
      imageUrl: command.imageUrl,
    });
    const updated = await this.userRepository.update(user.id, user);
    this.logger.verbose(`Profile ${user.id} updated`);
    this.userEventBus.publish(new UserUpdatedEvent(updated.getProps()));
    return updated;
  }

  private validate(command: UpdateCurrentUserCommand): string | undefined {
    if (command.name === undefined && command.settings === undefined && command.imageUrl === undefined) {
      throw new ValidationError('At least one of name, settings or imageUrl must be provided');
    }
    if (command.imageUrl !== undefined && command.imageUrl !== null && typeof command.imageUrl !== 'string') {
      throw new ValidationError('Image URL must be a string or null');
    }
    if (command.settings && !['metric', 'imperial'].includes(command.settings.measurementSystem)) {
      throw new ValidationError('Measurement system must be metric or imperial');
    }
    if (command.name === undefined) return undefined;
    if (typeof command.name !== 'string') {
      throw new ValidationError('User name must be a string');
    }
    const name = command.name.trim();
    if (name.length < DISPLAY_NAME_MIN_LENGTH || name.length > DISPLAY_NAME_MAX_LENGTH) {
      throw new ValidationError(`User name must have between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters`);
    }
    if (!DISPLAY_NAME_PATTERN.test(name)) {
      throw new ValidationError('User name may only contain letters, digits, spaces, dots, dashes and underscores');
    }
    return name;
  }
}
