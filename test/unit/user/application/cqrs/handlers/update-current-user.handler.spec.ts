import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictError, NotFoundError, ValidationError } from 'src/modules/shared/domain/errors/errors';
import { UpdateCurrentUserCommand } from 'src/modules/user/application/cqrs/commands/update-current-user.command';
import { UpdateCurrentUserHandler } from 'src/modules/user/application/cqrs/handlers/update-current-user.handler';
import { UserEventBusPort } from 'src/modules/user/application/ports/user-event-bus.port';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user.repository';

const user = (id: string, name: string) =>
  User.create({
    id,
    name,
    email: `${name}@example.com`,
    emailVerified: true,
    enabled: true,
    features: ['rmu-user'],
    imageUrl: null,
    settings: UserSettings.default(),
  });

describe('UpdateCurrentUserHandler', () => {
  let repository: InMemoryUserRepository;
  let publish: jest.Mock<UserEventBusPort['publish']>;
  let handler: UpdateCurrentUserHandler;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    repository.seed(user('user-1', 'alice'));
    repository.seed(user('user-2', 'bob'));
    publish = jest.fn<UserEventBusPort['publish']>();
    handler = new UpdateCurrentUserHandler(repository, { publish });
  });

  it('updates the display name, settings and image in the profile only', async () => {
    const result = await handler.execute(
      new UpdateCurrentUserCommand(' Alice W ', new UserSettings('metric'), 'images/alice.png', 'user-1', ['rmu-user']),
    );

    expect(result.name).toBe('Alice W');
    expect(result.settings.measurementSystem).toBe('metric');
    expect(result.imageUrl).toBe('images/alice.png');
    expect(result.features).toEqual(['rmu-user']);
    expect(repository.store.get('user-1')!.name).toBe('Alice W');
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('allows changing only the case of the own name', async () => {
    const result = await handler.execute(new UpdateCurrentUserCommand('ALICE', undefined, undefined, 'user-1', []));
    expect(result.name).toBe('ALICE');
  });

  it('rejects a name used by another profile (case-insensitive) with a ConflictError', async () => {
    await expect(handler.execute(new UpdateCurrentUserCommand('Bob', undefined, undefined, 'user-1', []))).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repository.store.get('user-1')!.name).toBe('alice');
    expect(publish).not.toHaveBeenCalled();
  });

  it('keeps the name when only the settings change', async () => {
    const result = await handler.execute(new UpdateCurrentUserCommand(undefined, new UserSettings('metric'), null, 'user-1', []));
    expect(result.name).toBe('alice');
    expect(result.imageUrl).toBeNull();
  });

  it('rejects empty requests and invalid names', async () => {
    await expect(handler.execute(new UpdateCurrentUserCommand(undefined, undefined, undefined, 'user-1', []))).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(handler.execute(new UpdateCurrentUserCommand('  a ', undefined, undefined, 'user-1', []))).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(handler.execute(new UpdateCurrentUserCommand('<script>', undefined, undefined, 'user-1', []))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('fails with NotFoundError when the profile does not exist yet', async () => {
    await expect(handler.execute(new UpdateCurrentUserCommand('carol', undefined, undefined, 'user-9', []))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
