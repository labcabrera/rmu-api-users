import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryCriteria } from '../../../../shared/application/criteria/query-criteria';
import { Page } from '../../../../shared/application/pagination/page';
import { Friendship } from '../../../domain/aggregates/friendship';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port';
import { ListFriendshipsQuery } from '../queries/list-friendships.query';

@QueryHandler(ListFriendshipsQuery)
export class ListFriendshipsHandler implements IQueryHandler<ListFriendshipsQuery, Page<Friendship>> {
  constructor(@Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository) {}

  async execute(query: ListFriendshipsQuery): Promise<Page<Friendship>> {
    //TODO check security filter
    const filter = QueryCriteria.anyOf([QueryCriteria.eq('requesterId', query.userId), QueryCriteria.eq('addresseeId', query.userId)]);
    return this.friendshipRepository.findByRsql(query.q ?? '', query.page, query.size, filter);
  }
}
