import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DOMAIN_EVENT_PUBLISHER, type DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher.port.js';
import { MANAGED_GROUPS, RMU_ADMIN } from '../../../../shared/domain/entities/user-roles.js';
import { BadGatewayError, ConflictError, ForbiddenError, NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { User } from '../../../domain/aggregates/user.js';
import { UserUpdatedEvent } from '../../../domain/events/user-events.js';
import { type IamUserPort, IAM_USER_PORT } from '../../ports/iam-user.port.js';
import { type UserRepository, USER_REPOSITORY } from '../../ports/user-repository.port.js';
import { SetUserEnabledCommand } from '../commands/set-user-enabled.command.js';
import { UpdateUserGroupsCommand } from '../commands/update-user-groups.command.js';
import { GetUserByIdQuery } from '../queries/get-user-by-id.query.js';

const requireAdmin = (roles: string[], action: string) => {
  if (!roles.includes(RMU_ADMIN)) throw new ForbiddenError(`You do not have permission to ${action}`);
};

async function loadUser(repository: UserRepository, id: string): Promise<User> {
  const user = await repository.findById(id);
  if (!user) throw new NotFoundError('User', id);
  return user;
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, User> {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  execute(query: GetUserByIdQuery): Promise<User> {
    requireAdmin(query.roles, 'read users');
    return loadUser(this.userRepository, query.id);
  }
}

/**
 * Keycloak decides the groups: the handler adds and removes the managed ones to match the request and then copies the
 * result into the profile, which otherwise only refreshes on the user's next sign-in. Groups outside the managed list are
 * left alone. An administrator cannot take rmu-admin away from themselves (nobody would be left to give it back).
 */
@CommandHandler(UpdateUserGroupsCommand)
export class UpdateUserGroupsHandler implements ICommandHandler<UpdateUserGroupsCommand, User> {
  private readonly logger = new Logger(UpdateUserGroupsHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(IAM_USER_PORT) private readonly iam: IamUserPort,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: UpdateUserGroupsCommand): Promise<User> {
    requireAdmin(command.roles, 'change the groups of a user');
    if (command.id === command.userId && !command.groups.includes(RMU_ADMIN)) {
      throw new ConflictError('An administrator cannot remove their own rmu-admin group', 'self-admin-removal');
    }
    const user = await loadUser(this.userRepository, command.id);
    const realmGroups = await this.iam.findGroups();
    const current = await this.iam.findUserGroups(user.id);
    const wanted = new Set<string>(command.groups);

    for (const name of MANAGED_GROUPS) {
      const member = current.some(group => group.name === name);
      if (member === wanted.has(name)) continue;
      const group = realmGroups.find(candidate => candidate.name === name);
      if (!group) throw new BadGatewayError(`Keycloak has no group ${name}`);
      this.logger.log(`${member ? 'Removing' : 'Adding'} user ${user.id} ${member ? 'from' : 'to'} group ${name} by ${command.userId}`);
      if (member) await this.iam.removeUserFromGroup(user.id, group.id);
      else await this.iam.addUserToGroup(user.id, group.id);
    }

    const groups = (await this.iam.findUserGroups(user.id)).map(group => group.name).sort();
    user.update({ features: groups });
    const updated = await this.userRepository.update(user);
    void this.events.publish('user', new UserUpdatedEvent(updated.getProps()));
    return updated;
  }
}

/** Enables or disables the Keycloak account and its profile. An administrator cannot disable their own account. */
@CommandHandler(SetUserEnabledCommand)
export class SetUserEnabledHandler implements ICommandHandler<SetUserEnabledCommand, User> {
  private readonly logger = new Logger(SetUserEnabledHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(IAM_USER_PORT) private readonly iam: IamUserPort,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: SetUserEnabledCommand): Promise<User> {
    requireAdmin(command.roles, 'enable or disable users');
    if (command.id === command.userId && !command.enabled) {
      throw new ConflictError('An administrator cannot disable their own account', 'self-disable');
    }
    const user = await loadUser(this.userRepository, command.id);
    if (user.enabled === command.enabled) return user;
    this.logger.log(`${command.enabled ? 'Enabling' : 'Disabling'} user ${user.id} by ${command.userId}`);
    await this.iam.setEnabled(user.id, command.enabled);
    user.update({ enabled: command.enabled });
    const updated = await this.userRepository.update(user);
    void this.events.publish('user', new UserUpdatedEvent(updated.getProps()));
    return updated;
  }
}
