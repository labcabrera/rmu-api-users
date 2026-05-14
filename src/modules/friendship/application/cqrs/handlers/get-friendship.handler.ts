import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from 'src/modules/shared/domain/errors/errors';
import { Friendship } from '../../../domain/aggregates/friendship';
import type { FriendshipRepository } from '../../ports/friendship.repository';
import { GetFriendshipQuery } from '../queries/get-friendship.query';

@QueryHandler(GetFriendshipQuery)
export class GetFriendshipHandler implements IQueryHandler<GetFriendshipQuery, Friendship> {
  constructor(@Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository) {}

  async execute(query: GetFriendshipQuery): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(query.id);
    if (!friendship || !friendship.hasParticipant(query.userId)) {
      throw new NotFoundError('Friendship', query.id);
    }
    return friendship;
  }
}
