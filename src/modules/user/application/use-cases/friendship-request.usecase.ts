import { Inject, Injectable } from '@nestjs/common';

import { FriendshipRequestCommand } from '../commands/friendship-request.command';
import { UserNotFoundError, ValidationError } from '../../domain/errors/errors';
import * as userSearchPort from '../ports/out/user-search.port';
import * as friendshipRepository from '../ports/out/friendship.repository';

@Injectable()
export class FriendshipRequestUseCase {
  constructor(
    @Inject('UserSearchPort') private readonly userSearchPort: userSearchPort.UserSearchPort,
    @Inject('FriendshipRepository') private readonly friendshipRepository: friendshipRepository.FriendshipRepository,
  ) {}

  async execute(command: FriendshipRequestCommand): Promise<void> {
    const email = command.friendEmail;
    const addresseeInfo = await this.userSearchPort.findByEmail(email);
    if (!addresseeInfo) {
      throw new UserNotFoundError(`User with email ${email} not found`);
    }
    if (addresseeInfo.id === command.userId) {
      throw new ValidationError(`Cannot send a friendship request to yourself`);
    }
    const rsql = `requesterId=='${command.userId}';addresseeId=='${addresseeInfo.id}'`;
    const current = await this.friendshipRepository.findByRsql(rsql, 0, 1);
    if (current) {
      console.log(`Friendship already exists between ${command.userId} and ${addresseeInfo.id}`);
    }
    //TODO check user not already a friend
    //TODO check blocked users
    throw new Error('Method not implemented.');
  }
}
