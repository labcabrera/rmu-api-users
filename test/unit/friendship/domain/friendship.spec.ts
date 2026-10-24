import { Friendship } from '../../../../src/modules/friendship/domain/aggregates/friendship.js';
import type { FriendshipStatus } from '../../../../src/modules/friendship/domain/value-objects/friendship-status.vo.js';

const friendship = (status: FriendshipStatus = 'pending') =>
  Friendship.fromProps({
    id: 'f-1',
    requesterId: 'u-1',
    requesterName: 'alice',
    addresseeId: 'u-2',
    addresseeName: 'bob',
    status,
    message: 'Hi',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: null,
  });

describe('Friendship', () => {
  it.each([
    ['pending', 'accepted'],
    ['pending', 'rejected'],
    ['pending', 'blocked'],
    ['accepted', 'blocked'],
  ] as const)('moves from %s to %s [F-users-16]', (from, to) => {
    const f = friendship(from);
    f.update({ status: to });
    expect(f.status).toBe(to);
  });

  it.each([
    ['accepted', 'pending'],
    ['accepted', 'rejected'],
    ['rejected', 'accepted'],
    ['rejected', 'pending'],
    ['blocked', 'accepted'],
    ['blocked', 'pending'],
  ] as const)('rejects moving from %s to %s [F-users-16]', (from, to) => {
    expect(() => friendship(from).update({ status: to })).toThrow(
      expect.objectContaining({ statusCode: 400, code: 'invalid-status-transition' }) as Error,
    );
  });

  it('takes the same status again as no change', () => {
    const f = friendship('accepted').restoreVersion(1);
    f.update({ status: 'accepted' });
    expect(f.hasChanges()).toBe(false);
  });

  it('reopens a rejected friendship in the direction of the new request [F-users-17]', () => {
    const f = friendship('rejected');
    f.reopen({ id: 'u-2', name: 'bob' }, { id: 'u-1', name: 'alice' }, null);
    expect(f).toMatchObject({ status: 'pending', requesterId: 'u-2', addresseeId: 'u-1', message: null });
    expect(() => friendship('accepted').reopen({ id: 'u-2', name: 'bob' }, { id: 'u-1', name: 'alice' }, null)).toThrow(
      expect.objectContaining({ code: 'invalid-status-transition' }) as Error,
    );
  });

  it('compares the participants by id, never by name [F-users-20]', () => {
    const f = friendship();
    expect(f.hasParticipant('u-1')).toBe(true);
    expect(f.hasParticipant('u-2')).toBe(true);
    expect(f.hasParticipant('bob')).toBe(false);
    expect(() =>
      Friendship.create({ requesterId: 'bob', requesterName: 'x', addresseeId: 'u-2', addresseeName: 'bob', message: null }),
    ).not.toThrow();
    expect(() =>
      Friendship.create({ requesterId: 'u-2', requesterName: 'bob', addresseeId: 'u-2', addresseeName: 'bob', message: null }),
    ).toThrow('Requester and addressee must be different users');
  });
});
