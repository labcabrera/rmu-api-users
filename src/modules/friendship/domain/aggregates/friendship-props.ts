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
  createdAt: Date;
  updatedAt: Date | null;
}
