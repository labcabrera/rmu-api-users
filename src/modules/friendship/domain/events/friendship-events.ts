import { DomainEvent } from '../../../shared/domain/events/domain-event.js';
import type { FriendshipProps } from '../aggregates/friendship-props.js';

/**
 * Published to `internal.rmu-users.friendship.updated.v1` after each change of status (spec 069). Core removes the
 * realm shares between the two users when the status becomes `blocked`.
 */
export class FriendshipUpdatedEvent extends DomainEvent<FriendshipProps> {
  constructor(data: FriendshipProps) {
    super('updated', data);
  }
}

/** Published to `internal.rmu-users.friendship.deleted.v1` (spec 069): core removes the shares between them. */
export class FriendshipDeletedEvent extends DomainEvent<FriendshipProps> {
  constructor(data: FriendshipProps) {
    super('deleted', data);
  }
}
