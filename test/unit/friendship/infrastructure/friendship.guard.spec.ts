import { Friendship } from '../../../../src/modules/friendship/domain/aggregates/friendship.js';
import type { FriendshipStatus } from '../../../../src/modules/friendship/domain/value-objects/friendship-status.vo.js';
import { FriendshipGuard } from '../../../../src/modules/friendship/infrastructure/security/friendship.guard.js';

const friendship = (status: FriendshipStatus, blockedBy: string | null = null) =>
  Friendship.fromProps({
    id: 'f-1',
    requesterId: 'u-1',
    requesterName: 'alice',
    addresseeId: 'u-2',
    addresseeName: 'bob',
    status,
    blockedBy,
    message: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: null,
  });

const guard = new FriendshipGuard();
const forbidden = expect.objectContaining({ statusCode: 403 }) as Error;
const notFound = expect.objectContaining({ statusCode: 404 }) as Error;

describe('FriendshipGuard', () => {
  describe('checkUpdate', () => {
    it('lets either participant block [spec 044, decision 9]', () => {
      expect(guard.checkUpdate(friendship('accepted'), 'f-1', 'u-1', 'blocked').id).toBe('f-1');
      expect(guard.checkUpdate(friendship('pending'), 'f-1', 'u-2', 'blocked').id).toBe('f-1');
      expect(() => guard.checkUpdate(friendship('accepted'), 'f-1', 'u-3', 'blocked')).toThrow(notFound);
    });

    it.each(['accepted', 'rejected', 'pending', undefined] as const)('keeps %s for the addressee only', status => {
      expect(() => guard.checkUpdate(friendship('pending'), 'f-1', 'u-1', status)).toThrow(forbidden);
      expect(guard.checkUpdate(friendship('pending'), 'f-1', 'u-2', status).id).toBe('f-1');
    });
  });

  describe('checkDelete', () => {
    it('lets only blockedBy delete a block', () => {
      expect(guard.checkDelete(friendship('blocked', 'u-1'), 'f-1', 'u-1').id).toBe('f-1');
      expect(() => guard.checkDelete(friendship('blocked', 'u-1'), 'f-1', 'u-2')).toThrow(forbidden);
      expect(() => guard.checkDelete(friendship('blocked', 'u-1'), 'f-1', 'u-3')).toThrow(notFound);
    });

    it('lets either participant delete a friendship that is not blocked', () => {
      for (const status of ['pending', 'accepted', 'rejected'] as const) {
        expect(guard.checkDelete(friendship(status), 'f-1', 'u-1').id).toBe('f-1');
        expect(guard.checkDelete(friendship(status), 'f-1', 'u-2').id).toBe('f-1');
      }
    });
  });
});
