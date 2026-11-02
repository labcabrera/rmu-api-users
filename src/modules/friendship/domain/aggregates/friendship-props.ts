import type { FriendshipStatus } from '../value-objects/friendship-status.vo.js';

export interface FriendshipProps {
  id: string;
  requesterId: string;
  requesterName: string;
  addresseeId: string;
  addresseeName: string;
  status: FriendshipStatus;
  /** Participant that blocked the friendship (decision 9 of spec 044); null unless the status is blocked. */
  blockedBy: string | null;
  message: string | null;
  /**
   * When the current request was sent: on create and on reopen (spec 070). It counts the requests of a user per day.
   * Friendships stored before it existed, and those made from an invite, have none.
   */
  requestedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}
