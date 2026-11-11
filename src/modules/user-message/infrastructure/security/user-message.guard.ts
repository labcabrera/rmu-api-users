import { Injectable } from '@nestjs/common';
import { RMU_ADMIN } from '../../../shared/domain/entities/user-roles.js';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors/errors.js';
import { checkCreateRole } from '../../../shared/infrastructure/security/base-entity-guard.js';
import type { Friendship } from '../../../friendship/domain/aggregates/friendship.js';
import { UserMessage } from '../../domain/aggregates/user-message.js';

/**
 * Who may do what with a message (spec 021, decision 2):
 * - sending needs `rmu-user` or `rmu-admin`, a recipient that exists and an accepted friendship with it; an admin
 *   (the service account among them) sends without the friendship;
 * - reading, marking as read and deleting is for the recipient; anybody else gets 404, as if it did not exist.
 */
@Injectable()
export class UserMessageGuard {
  checkCreate(roles: string[]): void {
    checkCreateRole(roles, 'messages');
  }

  checkFriendship(friendship: Friendship | null, senderId: string, roles: string[]): void {
    if (roles.includes(RMU_ADMIN)) return;
    if (friendship?.status === 'accepted' && friendship.hasParticipant(senderId)) return;
    throw new ForbiddenError('Messages can only be sent to an accepted friend', 'not-friends');
  }

  /** The message if the user is its recipient, or a NotFoundError. */
  checkRecipient(message: UserMessage | null, id: string, userId: string): UserMessage {
    if (!message || message.userId !== userId) throw new NotFoundError('UserMessage', id);
    return message;
  }
}
