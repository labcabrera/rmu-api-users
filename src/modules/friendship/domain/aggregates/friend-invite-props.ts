export interface FriendInviteProps {
  id: string;
  /** SHA-256 (hex) of the token: the token itself is never stored (spec 070, decision 4). */
  tokenHash: string;
  inviterId: string;
  inviterName: string;
  createdAt: Date;
  expiresAt: Date;
}
