import { Inject, Injectable } from '@nestjs/common';

import { UserSettings } from '../../domain/entities/user-settings.entity';
import * as userSearchPort from '../ports/out/user-search.port';
import { RequestFriendCommand } from '../commands/friend-request.command';

@Injectable()
export class RequestFriendUseCase {
  constructor(@Inject('UserSearchPort') private readonly userSearchPort: userSearchPort.UserSearchPort) {}

  async execute(command: RequestFriendCommand): Promise<UserSettings> {
    const email = command.friendEmail;
    const friendInfo = await this.userSearchPort.findByEmail(email);
    if (!friendInfo) {
      throw new Error(`User with email ${email} not found`);
    }
    //TODO check user != current user
    //TODO check user not already a friend
    //TODO check blocked users
    throw new Error('Method not implemented.');
  }
}
