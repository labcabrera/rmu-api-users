import { FriendInvite } from '../../domain/aggregates/friend-invite.js';

export interface FriendInviteRepository {
  findById(id: string): Promise<FriendInvite | null>;
  /** The invite of a token hash, if it has not expired yet. */
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<FriendInvite | null>;
  /** The invites of a user that have not expired, newest first. */
  findActiveByInviter(inviterId: string, now: Date): Promise<FriendInvite[]>;
  countActiveByInviter(inviterId: string, now: Date): Promise<number>;
  save(invite: FriendInvite): Promise<FriendInvite>;
  /**
   * Deletes the invite if it is still there and active, atomically: true for the one caller that consumed it, false
   * for any other (spec 070, decision 4).
   */
  consume(id: string, now: Date): Promise<boolean>;
  /** Writes the new name of a user in the invites they created. */
  renameInviter(userId: string, name: string): Promise<void>;
  deleteById(id: string): Promise<FriendInvite | null>;
}

export const FRIEND_INVITE_REPOSITORY = Symbol('FriendInviteRepository');
