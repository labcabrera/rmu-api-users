import { describe, expect, it, jest } from '@jest/globals';
import { IamUserPort } from 'src/modules/user/application/ports/iam-user.port';
import { UpdateCurrentUserCommand } from 'src/modules/user/application/cqrs/commands/update-current-user.command';
import { UpdateCurrentUserHandler } from 'src/modules/user/application/cqrs/handlers/update-current-user.handler';
import { UserRepository } from 'src/modules/user/application/ports/user-repository';
import { User } from 'src/modules/user/domain/aggregates/user';
import { UserSettings } from 'src/modules/user/domain/value-objects/user-settings.vo';

describe('UpdateCurrentUserHandler', () => {
  const iamUser = {
    id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    emailVerified: true,
    enabled: true,
  };

  const createUser = () =>
    User.create({
      id: 'user-1',
      name: 'alice',
      email: 'alice@example.com',
      emailVerified: true,
      enabled: true,
      features: ['basic'],
      imageUrl: null,
      settings: UserSettings.default(),
    });

  it('updates Keycloak name and MongoDB user profile', async () => {
    const user = createUser();
    const findById = jest.fn<() => Promise<User | null>>().mockResolvedValue(user);
    const update = jest
      .fn<(id: string, user: User) => Promise<User>>()
      .mockImplementation((_id, updatedUser) => Promise.resolve(updatedUser));
    const findIamUserById = jest.fn<() => Promise<typeof iamUser | null>>().mockResolvedValue(iamUser);
    const updateName = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const userRepository = {
      findById,
      update,
    } as unknown as UserRepository;
    const iamUserPort = {
      findById: findIamUserById,
      updateName,
    } as unknown as IamUserPort;
    const handler = new UpdateCurrentUserHandler(userRepository, iamUserPort);

    const result = await handler.execute(
      new UpdateCurrentUserCommand('alice-updated', new UserSettings('metric'), 'https://example.com/alice.png', 'user-1', [
        'basic',
        'advanced',
      ]),
    );

    expect(updateName).toHaveBeenCalledWith('user-1', 'alice-updated');
    expect(update).toHaveBeenCalledWith('user-1', expect.any(User));
    expect(result.name).toBe('alice-updated');
    expect(result.settings.measurementSystem).toBe('metric');
    expect(result.imageUrl).toBe('https://example.com/alice.png');
    expect(result.features).toEqual(['basic', 'advanced']);
  });

  it('does not update Keycloak when name is not changed', async () => {
    const user = createUser();
    const findById = jest.fn<() => Promise<User | null>>().mockResolvedValue(user);
    const update = jest
      .fn<(id: string, user: User) => Promise<User>>()
      .mockImplementation((_id, updatedUser) => Promise.resolve(updatedUser));
    const findIamUserById = jest.fn<() => Promise<typeof iamUser | null>>().mockResolvedValue(iamUser);
    const updateName = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const userRepository = {
      findById,
      update,
    } as unknown as UserRepository;
    const iamUserPort = {
      findById: findIamUserById,
      updateName,
    } as unknown as IamUserPort;
    const handler = new UpdateCurrentUserHandler(userRepository, iamUserPort);

    const result = await handler.execute(new UpdateCurrentUserCommand(undefined, new UserSettings('metric'), null, 'user-1', ['basic']));

    expect(updateName).not.toHaveBeenCalled();
    expect(result.settings.measurementSystem).toBe('metric');
    expect(result.imageUrl).toBeNull();
  });
});
