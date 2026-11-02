import { createHash, randomBytes, randomUUID } from 'crypto';
import { BaseAggregateRoot } from '../../../shared/domain/aggregates/base-aggregate.js';
import type { FriendInviteProps } from './friend-invite-props.js';

/** Days an invite link works (spec 070, decision 4). */
export const FRIEND_INVITE_TTL_DAYS = 7;
/** Invites a user may have active at once. */
export const MAX_ACTIVE_FRIEND_INVITES = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/** SHA-256 (hex) of an invite token: what is stored and looked up. */
export const hashInviteToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * A single-use link that makes its inviter and whoever opens it friends (spec 070). The token is random (24 bytes,
 * base64url) and is returned once, on creation; only its hash is kept.
 */
export class FriendInvite extends BaseAggregateRoot<FriendInviteProps> {
  constructor(
    id: string,
    public readonly tokenHash: string,
    public readonly inviterId: string,
    public readonly inviterName: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
  ) {
    super(id);
  }

  /** A new invite and its token, which the caller hands to the inviter and does not keep. */
  static create(inviter: { id: string; name: string }, now: Date = new Date()): { invite: FriendInvite; token: string } {
    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(now.getTime() + FRIEND_INVITE_TTL_DAYS * DAY_MS);
    const invite = new FriendInvite(randomUUID(), hashInviteToken(token), inviter.id, inviter.name, now, expiresAt);
    return { invite, token };
  }

  static fromProps(props: FriendInviteProps): FriendInvite {
    return new FriendInvite(props.id, props.tokenHash, props.inviterId, props.inviterName, props.createdAt, props.expiresAt);
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  getProps(): FriendInviteProps {
    return {
      id: this.id,
      tokenHash: this.tokenHash,
      inviterId: this.inviterId,
      inviterName: this.inviterName,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
    };
  }
}
