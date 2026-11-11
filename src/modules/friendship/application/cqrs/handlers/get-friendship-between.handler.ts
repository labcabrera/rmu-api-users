import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { RMU_ADMIN } from '../../../../shared/domain/entities/user-roles.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { GetFriendshipBetweenQuery } from '../queries/get-friendship-between.query.js';

@QueryHandler(GetFriendshipBetweenQuery)
export class GetFriendshipBetweenHandler implements IQueryHandler<GetFriendshipBetweenQuery, Friendship> {
  constructor(@Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository) {}

  /** Admins only: it is how core checks, with its service account, that a realm is shared with a friend. */
  async execute(query: GetFriendshipBetweenQuery): Promise<Friendship> {
    if (!query.roles.includes(RMU_ADMIN)) throw new ForbiddenError('Only an admin reads the friendship of two other users');
    const friendship = await this.friendshipRepository.findByParticipants(query.userA, query.userB);
    if (!friendship) throw new NotFoundError('Friendship', `${query.userA}/${query.userB}`);
    return friendship;
  }
}
