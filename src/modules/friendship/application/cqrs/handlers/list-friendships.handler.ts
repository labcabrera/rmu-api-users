import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryCriteria } from '../../../../shared/application/criteria/query-criteria.js';
import { Page } from '../../../../shared/application/pagination/page.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { ListFriendshipsQuery } from '../queries/list-friendships.query.js';

@QueryHandler(ListFriendshipsQuery)
export class ListFriendshipsHandler implements IQueryHandler<ListFriendshipsQuery, Page<Friendship>> {
  constructor(@Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository) {}

  async execute(query: ListFriendshipsQuery): Promise<Page<Friendship>> {
    //TODO check security filter
    const filter = QueryCriteria.anyOf([QueryCriteria.eq('requesterId', query.userId), QueryCriteria.eq('addresseeId', query.userId)]);
    return this.friendshipRepository.findByRsql(query.q ?? '', query.page, query.size, filter);
  }
}
