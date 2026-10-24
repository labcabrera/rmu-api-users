import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { GetFriendshipQuery } from '../queries/get-friendship.query.js';

@QueryHandler(GetFriendshipQuery)
export class GetFriendshipHandler implements IQueryHandler<GetFriendshipQuery, Friendship> {
  constructor(@Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository) {}

  async execute(query: GetFriendshipQuery): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(query.id);
    if (!friendship || !friendship.hasParticipant(query.userId)) {
      throw new NotFoundError('Friendship', query.id);
    }
    return friendship;
  }
}
