import { Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors/errors.js';
import { checkCreateRole } from '../../../shared/infrastructure/security/base-entity-guard.js';
import { Friendship } from '../../domain/aggregates/friendship.js';

/**
 * Who may do what with a friendship (spec 021, decision 2):
 * - sending a request needs `rmu-user` or `rmu-admin`;
 * - reading and deleting is for its two participants;
 * - answering (PATCH) is for the addressee: the requester gets 403;
 * - anybody else gets 404, as if the friendship did not exist (F-users-18), admins included: it is personal data.
 */
@Injectable()
export class FriendshipGuard {
  checkCreate(roles: string[]): void {
    checkCreateRole(roles, 'friendship requests');
  }

  /** The friendship if the user takes part in it, or a NotFoundError. */
  checkParticipant(friendship: Friendship | null, id: string, userId: string): Friendship {
    if (!friendship || !friendship.hasParticipant(userId)) throw new NotFoundError('Friendship', id);
    return friendship;
  }

  checkUpdate(friendship: Friendship | null, id: string, userId: string): Friendship {
    const found = this.checkParticipant(friendship, id, userId);
    if (found.addresseeId !== userId) throw new ForbiddenError('Only the addressee can accept or reject a friendship request');
    return found;
  }
}
