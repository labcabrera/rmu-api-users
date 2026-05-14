import { FriendshipStatus } from '../value-objects/friendship-status.vo';

export interface FriendshipProps {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
