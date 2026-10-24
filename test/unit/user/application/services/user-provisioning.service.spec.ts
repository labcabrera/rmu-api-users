import type { Mock } from 'vitest';
import type { UserClaims } from '../../../../../src/modules/user/application/models/user-claims.js';
import { type IamUserPort, type UserApiResponse } from '../../../../../src/modules/user/application/ports/iam-user.port.js';
import type { DomainEventPublisher } from '../../../../../src/modules/shared/application/ports/domain-event-publisher.port.js';
import {
  LAST_LOGIN_REFRESH_MS,
  UserProvisioningService,
} from '../../../../../src/modules/user/application/services/user-provisioning.service.js';
import { User } from '../../../../../src/modules/user/domain/aggregates/user.js';
import { UserSettings } from '../../../../../src/modules/user/domain/value-objects/user-settings.vo.js';
import { InMemoryUserRepository } from '../../../../support/in-memory-user.repository.js';

const claims = (overrides: Partial<UserClaims> = {}): UserClaims => ({
  id: 'user-1',
  email: 'alice@example.com',
  emailVerified: true,
  username: 'alice',
  givenName: 'Alice',
  familyName: 'Liddell',
  groups: ['rmu-user', 'core-law'],
  identityProvider: 'local',
  ...overrides,
});

const existingUser = (id: string, name: string) =>
  User.create({
    id,
    name,
    email: `${name}@example.com`,
    emailVerified: true,
    enabled: true,
    features: [],
    settings: UserSettings.default(),
    imageUrl: null,
  });

describe('UserProvisioningService', () => {
  let repository: InMemoryUserRepository;
  let publish: Mock<DomainEventPublisher['publish']>;
  let iam: { [K in keyof IamUserPort]: Mock };
  let service: UserProvisioningService;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    publish = vi.fn<DomainEventPublisher['publish']>().mockResolvedValue(undefined);
    iam = {
      findById: vi.fn(),
      findByUsername: vi.fn<() => Promise<UserApiResponse | null>>().mockResolvedValue(null),
      findByEmail: vi.fn<() => Promise<UserApiResponse | null>>().mockResolvedValue(null),
      addUserToGroup: vi.fn(),
      findGroups: vi.fn(),
    };
    service = new UserProvisioningService(repository, iam, { publish, publishChanges: vi.fn() });
  });

  describe('provisionFromClaims', () => {
    it('creates the profile from the claims on first access and emits UserCreated', async () => {
      const now = new Date('2026-10-19T10:00:00Z');
      const user = await service.provisionFromClaims(claims(), now);

      expect(user.name).toBe('alice');
      expect(user.email).toBe('alice@example.com');
      expect(user.features).toEqual(['rmu-user', 'core-law']);
      expect(user.identityProvider).toBe('local');
      expect(user.firstName).toBe('Alice');
      expect(user.lastName).toBe('Liddell');
      expect(user.lastLoginAt).toEqual(now);
      expect(user.claimsFingerprint).toBe(UserProvisioningService.fingerprint(claims()));
      expect(repository.store.has('user-1')).toBe(true);
      expect(publish).toHaveBeenCalledTimes(1);
      expect(publish.mock.calls[0][1].eventType).toBe('created');
      expect(Object.values(iam).every(fn => fn.mock.calls.length === 0)).toBe(true);
    });

    it('derives the name from the email local part for brokered logins', async () => {
      const user = await service.provisionFromClaims(
        claims({ username: 'alice.smith@gmail.com', email: 'Alice.Smith@gmail.com', identityProvider: 'google' }),
      );
      expect(user.name).toBe('alice.smith');
      expect(user.identityProvider).toBe('google');
    });

    it('derives the name from the email local part when the username looks like an email', async () => {
      const user = await service.provisionFromClaims(claims({ username: 'bob@example.com', email: 'bob@example.com' }));
      expect(user.name).toBe('bob');
    });

    it('adds a numeric suffix when the name is taken', async () => {
      repository.seed(existingUser('other-1', 'alice'));
      repository.seed(existingUser('other-2', 'Alice-2'));

      const user = await service.provisionFromClaims(claims());

      expect(user.name).toBe('alice-3');
    });

    it('does not write when the claims are unchanged and the last login is recent', async () => {
      const t0 = new Date('2026-10-19T10:00:00Z');
      await service.provisionFromClaims(claims(), t0);
      const writes = repository.writes;
      publish.mockClear();

      const user = await service.provisionFromClaims(claims({ groups: ['core-law', 'rmu-user'] }), new Date(t0.getTime() + 10 * 60 * 1000));

      expect(repository.writes).toBe(writes);
      expect(publish).not.toHaveBeenCalled();
      expect(user.lastLoginAt).toEqual(t0);
    });

    it('updates the profile and emits UserUpdated when the claims change', async () => {
      const t0 = new Date('2026-10-19T10:00:00Z');
      await service.provisionFromClaims(claims(), t0);
      publish.mockClear();
      const t1 = new Date(t0.getTime() + 60 * 1000);

      const user = await service.provisionFromClaims(claims({ email: 'alice@new.example.com', groups: ['rmu-user', 'rmu-admin'] }), t1);

      expect(user.email).toBe('alice@new.example.com');
      expect(user.features).toEqual(['rmu-user', 'rmu-admin']);
      expect(user.name).toBe('alice');
      expect(user.lastLoginAt).toEqual(t1);
      expect(repository.store.get('user-1')!.email).toBe('alice@new.example.com');
      expect(publish).toHaveBeenCalledTimes(1);
      expect(publish.mock.calls[0][1].eventType).toBe('updated');
    });

    it('keeps the display name chosen by the user when the username claim changes', async () => {
      await service.provisionFromClaims(claims());
      const stored = repository.store.get('user-1')!;
      stored.name = 'Wonderland';

      const user = await service.provisionFromClaims(claims({ username: 'alice2' }));

      expect(user.name).toBe('Wonderland');
    });

    it('refreshes lastLoginAt at most once per hour without emitting events', async () => {
      const t0 = new Date('2026-10-19T10:00:00Z');
      await service.provisionFromClaims(claims(), t0);
      publish.mockClear();
      const writes = repository.writes;
      const later = new Date(t0.getTime() + LAST_LOGIN_REFRESH_MS + 1000);

      const user = await service.provisionFromClaims(claims(), later);

      expect(repository.writes).toBe(writes + 1);
      expect(repository.store.get('user-1')!.lastLoginAt).toEqual(later);
      expect(user.lastLoginAt).toEqual(later);
      expect(publish).not.toHaveBeenCalled();
    });

    it('returns the concurrent winner when another request created the same profile', async () => {
      const save = InMemoryUserRepository.prototype.save.bind(repository);
      vi.spyOn(repository, 'save').mockImplementationOnce(async (user: User) => {
        await save(existingUser('user-1', 'alice-from-other-request'));
        return save(user);
      });

      const user = await service.provisionFromClaims(claims());

      expect(user.name).toBe('alice-from-other-request');
      expect(publish).not.toHaveBeenCalled();
    });
  });

  describe('findOrProvisionByName', () => {
    const iamUser: UserApiResponse = {
      id: 'kc-9',
      username: 'carol',
      email: 'carol@example.com',
      emailVerified: true,
      enabled: true,
      firstName: 'Carol',
    };

    it('returns the local profile without calling Keycloak', async () => {
      repository.seed(existingUser('user-2', 'bob'));
      const user = await service.findOrProvisionByName('BOB');
      expect(user?.id).toBe('user-2');
      expect(iam.findByUsername).not.toHaveBeenCalled();
    });

    it('provisions a profile from the admin representation when there is no local profile', async () => {
      iam.findByUsername.mockResolvedValue(iamUser);

      const user = await service.findOrProvisionByName('carol');

      expect(iam.findByUsername).toHaveBeenCalledWith('carol');
      expect(user?.id).toBe('kc-9');
      expect(user?.name).toBe('carol');
      expect(user?.identityProvider).toBe('local');
      expect(user?.claimsFingerprint).toBeNull();
      expect(repository.store.has('kc-9')).toBe(true);
      expect(publish).toHaveBeenCalledTimes(1);
    });

    it('searches by email when the input looks like one', async () => {
      iam.findByEmail.mockResolvedValue({ ...iamUser, username: 'carol@example.com', identityProvider: 'google' });

      const user = await service.findOrProvisionByName('carol@example.com');

      expect(iam.findByEmail).toHaveBeenCalledWith('carol@example.com');
      expect(user?.name).toBe('carol');
      expect(user?.identityProvider).toBe('google');
    });

    it('returns the existing profile when the Keycloak user already has one under another name', async () => {
      repository.seed(existingUser('kc-9', 'carol-renamed'));
      iam.findByUsername.mockResolvedValue(iamUser);

      const user = await service.findOrProvisionByName('carol');

      expect(user?.name).toBe('carol-renamed');
      expect(publish).not.toHaveBeenCalled();
    });

    it('returns null for unknown or disabled users', async () => {
      expect(await service.findOrProvisionByName('nobody')).toBeNull();
      iam.findByUsername.mockResolvedValue({ ...iamUser, enabled: false });
      expect(await service.findOrProvisionByName('carol')).toBeNull();
      expect(repository.store.size).toBe(0);
    });
  });
});
