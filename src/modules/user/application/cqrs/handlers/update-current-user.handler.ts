import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ConflictError, NotFoundError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { sameState } from '../../../../shared/domain/aggregates/same-state.js';
import { User } from '../../../domain/aggregates/user.js';
import { UserUpdatedEvent } from '../../../domain/events/user-events.js';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, DISPLAY_NAME_PATTERN } from '../../../domain/services/display-name.js';
import { DOMAIN_EVENT_PUBLISHER, type DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher.port.js';
import { UserRepository } from '../../ports/user-repository.port.js';
import { UpdateCurrentUserCommand } from '../commands/update-current-user.command.js';

/** Updates the RMU profile only. The Keycloak account (username included) is never touched. */
@CommandHandler(UpdateCurrentUserCommand)
export class UpdateCurrentUserHandler implements ICommandHandler<UpdateCurrentUserCommand, User> {
  private readonly logger = new Logger(UpdateCurrentUserHandler.name);

  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: UpdateCurrentUserCommand): Promise<User> {
    const name = this.validate(command);

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundError('User', command.userId);
    }
    user.checkVersion(command.expectedVersion);

    if (name !== undefined && name !== user.name && (await this.userRepository.existsByName(name, user.id))) {
      throw new ConflictError(`User name ${name} is already in use`);
    }

    const before = user.getProps();
    user.update({
      name,
      settings: command.settings,
      imageUrl: command.imageUrl,
    });
    if (sameState(before, user.getProps())) return user;
    const updated = await this.userRepository.update(user);
    this.logger.verbose(`Profile ${user.id} updated`);
    void this.events.publish('user', new UserUpdatedEvent(updated.getProps()));
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
