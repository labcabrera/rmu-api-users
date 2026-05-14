import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryCriteria } from 'src/modules/shared/application/criteria/query-criteria';
import { Page } from 'src/modules/shared/domain/entities/page';
import { Friendship } from '../../../domain/aggregates/friendship';
import type { FriendshipRepository } from '../../ports/friendship.repository';
import { ListFriendshipsQuery } from '../queries/list-friendships.query';

@QueryHandler(ListFriendshipsQuery)
export class ListFriendshipsHandler implements IQueryHandler<ListFriendshipsQuery, Page<Friendship>> {
  constructor(@Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository) {}

  async execute(query: ListFriendshipsQuery): Promise<Page<Friendship>> {
    const filter = QueryCriteria.anyOf([QueryCriteria.eq('requesterId', query.userId), QueryCriteria.eq('addresseeName', query.userId)]);
    return this.friendshipRepository.findByRsql(query.q ?? '', query.page, query.size, filter);
  }
}
