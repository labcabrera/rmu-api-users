import type { FriendshipStatus } from '../value-objects/friendship-status.vo.js';

export interface FriendshipProps {
  id: string;
  requesterId: string;
  requesterName: string;
  addresseeId: string;
  addresseeName: string;
  status: FriendshipStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
