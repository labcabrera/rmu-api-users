import { Friendship } from '../../../../src/modules/friendship/domain/aggregates/friendship.js';
import type { FriendshipProps } from '../../../../src/modules/friendship/domain/aggregates/friendship-props.js';
import { User } from '../../../../src/modules/user/domain/aggregates/user.js';
import { UserSettings } from '../../../../src/modules/user/domain/value-objects/user-settings.vo.js';

const props = (): FriendshipProps => ({
  id: 'f-1',
  requesterId: 'u-1',
  requesterName: 'alice',
  addresseeId: 'u-2',
  addresseeName: 'bob',
  status: 'pending',
  message: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: null,
});

describe('BaseAggregateRoot', () => {
  it('keeps the version out of the JSON of the aggregate [F-receta-27]', () => {
    const friendship = Friendship.fromProps(props()).restoreVersion(3);
    expect(friendship.version).toBe(3);
    const json = JSON.parse(JSON.stringify(friendship)) as Record<string, unknown>;
    expect(Object.keys(json).some(key => key.toLowerCase().includes('version'))).toBe(false);
  });

  it('has changes when it was never stored', () => {
    expect(Friendship.fromProps(props()).hasChanges()).toBe(true);
  });

  it('compares the state with the one it was loaded with, without updatedAt [F-receta-23]', () => {
    const friendship = Friendship.fromProps(props()).restoreVersion(0);
    expect(friendship.hasChanges()).toBe(false);
    friendship.update({ message: null });
    expect(friendship.updatedAt).not.toBeNull();
    expect(friendship.hasChanges()).toBe(false);
    friendship.update({ message: 'Hi' });
    expect(friendship.hasChanges()).toBe(true);
  });

  it('sees no change when a value object is replaced by an equal one', () => {
    const user = User.create({
      id: 'u-1',
      name: 'alice',
      email: 'alice@example.com',
      emailVerified: true,
      enabled: true,
      features: [],
      settings: new UserSettings('metric'),
      imageUrl: null,
    }).restoreVersion(0);
    user.update({ settings: new UserSettings('metric') });
    expect(user.hasChanges()).toBe(false);
    user.update({ settings: new UserSettings('imperial') });
    expect(user.hasChanges()).toBe(true);
  });

  it('takes a new snapshot when the version is restored after a write', () => {
    const friendship = Friendship.fromProps(props()).restoreVersion(0);
    friendship.update({ message: 'Changed' });
    friendship.restoreVersion(1);
    expect(friendship.hasChanges()).toBe(false);
  });

  it('rejects a stale version', () => {
    const friendship = Friendship.fromProps(props()).restoreVersion(2);
    expect(() => friendship.checkVersion(undefined)).not.toThrow();
    expect(() => friendship.checkVersion(2)).not.toThrow();
    expect(() => friendship.checkVersion(1)).toThrow(expect.objectContaining({ statusCode: 409, code: 'version-conflict' }) as Error);
  });
});
