import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { FriendshipGuard } from '../../../infrastructure/security/friendship.guard.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { GetFriendshipQuery } from '../queries/get-friendship.query.js';

@QueryHandler(GetFriendshipQuery)
export class GetFriendshipHandler implements IQueryHandler<GetFriendshipQuery, Friendship> {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
  ) {}

  async execute(query: GetFriendshipQuery): Promise<Friendship> {
    return this.guard.checkParticipant(await this.friendshipRepository.findById(query.id), query.id, query.userId);
  }
}
