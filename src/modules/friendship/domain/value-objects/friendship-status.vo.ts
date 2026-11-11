export const FRIENDSHIP_STATUSES = ['pending', 'accepted', 'rejected', 'blocked'] as const;

export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

/**
 * The statuses each status can move to with a PATCH (F-users-16): the addressee answers a pending request, and an
 * accepted friendship can still be blocked. Rejected and blocked are final for a PATCH: a rejected request is reopened
 * by a new request (F-users-17), and a blocked one is undone by deleting it.
 */
export const FRIENDSHIP_TRANSITIONS: Record<FriendshipStatus, readonly FriendshipStatus[]> = {
  pending: ['accepted', 'rejected', 'blocked'],
  accepted: ['blocked'],
  rejected: [],
  blocked: [],
};
