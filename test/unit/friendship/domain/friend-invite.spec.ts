import { ConflictError, ValidationError } from '../../../../src/modules/shared/domain/errors/errors.js';
import {
  FRIEND_INVITE_TTL_DAYS,
  FriendInvite,
  hashInviteToken,
} from '../../../../src/modules/friendship/domain/aggregates/friend-invite.js';
import { Friendship } from '../../../../src/modules/friendship/domain/aggregates/friendship.js';

const alice = { id: 'u-alice', name: 'alice' };
const bob = { id: 'u-bob', name: 'bob' };

describe('FriendInvite (spec 070)', () => {
  it('keeps only the hash of a random token and expires after seven days', () => {
    const now = new Date('2026-11-03T10:00:00Z');
    const { invite, token } = FriendInvite.create(alice, now);
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(invite.tokenHash).toBe(hashInviteToken(token));
    expect(invite.tokenHash).not.toContain(token);
    expect(invite.expiresAt.getTime() - now.getTime()).toBe(FRIEND_INVITE_TTL_DAYS * 86_400_000);
    expect(invite.isExpired(now)).toBe(false);
    expect(invite.isExpired(invite.expiresAt)).toBe(true);
    expect(FriendInvite.create(alice, now).token).not.toBe(token);
    expect(FriendInvite.fromProps(invite.getProps()).getProps()).toEqual(invite.getProps());
  });
});

describe('Friendship from an invite (spec 070)', () => {
  it('is accepted, with the inviter as the requester', () => {
    const friendship = Friendship.fromInvite(alice, bob);
    expect(friendship.getProps()).toMatchObject({
      requesterId: 'u-alice',
      addresseeId: 'u-bob',
      status: 'accepted',
      requestedAt: null,
    });
    expect(() => Friendship.fromInvite(alice, alice)).toThrow(ValidationError);
  });

  it('accepts a pending or rejected friendship and turns its direction', () => {
    for (const status of ['pending', 'rejected'] as const) {
      const friendship = Friendship.create({
        requesterId: 'u-bob',
        requesterName: 'bob',
        addresseeId: 'u-alice',
        addresseeName: 'alice',
        message: 'hi',
      });
      friendship.status = status;
      friendship.acceptInvite(alice, bob);
      expect(friendship).toMatchObject({ requesterId: 'u-alice', addresseeId: 'u-bob', status: 'accepted', blockedBy: null });
    }
  });

  it('refuses an accepted or blocked friendship', () => {
    const friendship = Friendship.fromInvite(alice, bob);
    expect(() => friendship.acceptInvite(alice, bob)).toThrow(ConflictError);
    friendship.update({ status: 'blocked' }, 'u-bob');
    expect(() => friendship.acceptInvite(alice, bob)).toThrow(expect.objectContaining({ code: 'friendship-blocked' }));
  });

  it('records when each request was sent, also on reopen', () => {
    const friendship = Friendship.create({
      requesterId: 'u-bob',
      requesterName: 'bob',
      addresseeId: 'u-alice',
      addresseeName: 'alice',
      message: null,
    });
    expect(friendship.requestedAt).toEqual(friendship.createdAt);
    friendship.update({ status: 'rejected' });
    friendship.reopen(alice, bob, null);
    expect(friendship.requestedAt).toEqual(friendship.updatedAt);
    expect(() => Friendship.create({ requesterId: 'x', requesterName: 'x', addresseeId: 'x', addresseeName: 'x', message: null })).toThrow(
      expect.objectContaining({ code: 'friendship-self' }),
    );
  });
});
