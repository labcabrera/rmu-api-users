import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { RenameFriendshipParticipantCommand } from '../../../../friendship/application/cqrs/commands/rename-friendship-participant.command.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { User } from '../../../domain/aggregates/user.js';
import { UserUpdatedEvent } from '../../../domain/events/user-events.js';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, DISPLAY_NAME_PATTERN } from '../../../domain/services/display-name.js';
import { DOMAIN_EVENT_PUBLISHER, type DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher.port.js';
import { type UserRepository, USER_REPOSITORY } from '../../ports/user-repository.port.js';
import { UpdateCurrentUserCommand } from '../commands/update-current-user.command.js';

/** Updates the RMU profile only. The Keycloak account (username included) is never touched. */
@CommandHandler(UpdateCurrentUserCommand)
export class UpdateCurrentUserHandler implements ICommandHandler<UpdateCurrentUserCommand, User> {
  private readonly logger = new Logger(UpdateCurrentUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
    private readonly commandBus: CommandBus,
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

    const previousName = user.name;
    user.update({
      name,
      settings: command.settings,
      imageUrl: command.imageUrl,
    });
    if (!user.hasChanges()) return user;
    const updated = await this.userRepository.update(user);
    this.logger.verbose(`Profile ${user.id} updated`);
    if (updated.name !== previousName) await this.renameCopies(updated);
    void this.events.publish('user', new UserUpdatedEvent(updated.getProps()));
    return updated;
  }

  /** The name is saved already: a failure here leaves old copies, not a failed rename. Other APIs follow the event. */
  private async renameCopies(user: User): Promise<void> {
    try {
      await this.commandBus.execute(new RenameFriendshipParticipantCommand(user.id, user.name));
    } catch (error) {
      this.logger.error(`Could not rename user ${user.id} in their friendships: ${error instanceof Error ? error.message : String(error)}`);
    }
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
