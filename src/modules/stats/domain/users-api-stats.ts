import type { CollectionStats } from './collection-stats.js';

/** Days without signing in after which a user no longer counts as active. */
export const ACTIVE_DAYS = 30;

export interface UserStats extends CollectionStats {
  /** Signed in during the last ACTIVE_DAYS days. */
  active: number;
  /** Created since the first day of the current month (UTC). */
  newThisMonth: number;
}

export interface ActivationCodeStats {
  total: number;
  free: number;
  used: number;
  /** Not used and past their expiry date: they can no longer be redeemed. */
  expired: number;
}

export interface UsersApiStats {
  users: UserStats;
  activationCodes: ActivationCodeStats;
}
