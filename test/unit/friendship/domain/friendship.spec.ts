import { Friendship } from '../../../../src/modules/friendship/domain/aggregates/friendship.js';
import type { FriendshipStatus } from '../../../../src/modules/friendship/domain/value-objects/friendship-status.vo.js';

const friendship = (status: FriendshipStatus = 'pending', blockedBy: string | null = null) =>
  Friendship.fromProps({
    id: 'f-1',
    requesterId: 'u-1',
    requesterName: 'alice',
    addresseeId: 'u-2',
    addresseeName: 'bob',
    status,
    blockedBy,
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
    f.update({ status: to }, 'u-2');
    expect(f.status).toBe(to);
  });

  it.each(['u-1', 'u-2'])('records %s as blockedBy when it blocks [spec 044, decision 9]', by => {
    const f = friendship('accepted');
    expect(f.blockedBy).toBeNull();
    f.update({ status: 'blocked' }, by);
    expect(f.blockedBy).toBe(by);
    expect(f.getProps().blockedBy).toBe(by);
  });

  it('refuses a block without a participant as author', () => {
    expect(() => friendship('accepted').update({ status: 'blocked' })).toThrow(expect.objectContaining({ statusCode: 400 }) as Error);
    expect(() => friendship('accepted').update({ status: 'blocked' }, 'u-3')).toThrow(
      expect.objectContaining({ statusCode: 400 }) as Error,
    );
  });

  it('leaves blockedBy empty on other transitions and keeps it on the same status again', () => {
    const accepted = friendship('pending');
    accepted.update({ status: 'accepted' }, 'u-2');
    expect(accepted.blockedBy).toBeNull();
    const blocked = friendship('blocked', 'u-1');
    blocked.update({ status: 'blocked' }, 'u-2');
    expect(blocked.blockedBy).toBe('u-1');
  });

  it('reads a stored friendship without blockedBy as null', () => {
    const props = { ...friendship().getProps() } as Partial<ReturnType<Friendship['getProps']>>;
    delete props.blockedBy;
    expect(Friendship.fromProps(props as ReturnType<Friendship['getProps']>).blockedBy).toBeNull();
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
