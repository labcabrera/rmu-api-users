import { Inject, Injectable, Logger } from '@nestjs/common';
import { FriendshipRequestCommand } from '../commands/friendship-request.command';
import { Friendship } from '../../../domain/aggregates/friendship';
import type { UserSearchPort } from '../../ports/user-search.port';
import type { FriendshipRepository } from '../../ports/friendship.repository';
import { ValidationError } from 'src/modules/shared/domain/errors/errors';

@Injectable()
export class FriendshipRequestUseCase {
  private readonly logger = new Logger(FriendshipRequestUseCase.name);

  constructor(
    @Inject('UserSearchPort') private readonly userSearchPort: UserSearchPort,
    @Inject('FriendshipRepository') private readonly friendshipRepository: FriendshipRepository,
  ) {}

  async execute(command: FriendshipRequestCommand): Promise<void> {
    this.logger.log(`Executing for user ${command.userId} and friend ${command.addresseeEmail}`);
    const addresseeInfo = await this.userSearchPort.findByEmail(command.addresseeEmail);
    if (!addresseeInfo) {
      throw new ValidationError(`User with email ${command.addresseeEmail} not found`);
    }
    this.logger.debug(`Found addressee id ${addresseeInfo.id}`);
    if (addresseeInfo.id === command.userId) {
      throw new ValidationError(`Cannot send a friendship request to yourself`);
    }
    const current = await this.getExisting(command.userId, addresseeInfo.id);
    const inverse = await this.getExisting(addresseeInfo.id, command.userId);
    if (inverse) {
      switch (inverse?.status) {
        case 'blocked':
          // Silent ignore, as the user has already blocked the request
          return;
      }
    }
    if (current) {
      return this.processExistingFriendship(current);
    } else {
      await this.createNewFriendship(command.userId, addresseeInfo.id);
    }
  }
  private async getExisting(userId: string, addresseeId: string): Promise<Friendship | null> {
    const rsql = `requesterId==${userId};addresseeId==${addresseeId}`;
    const page = await this.friendshipRepository.findByRsql(rsql, 0, 1);
    return page.content.length > 0 ? page.content[0] : null;
  }

  private async processExistingFriendship(friendship: Friendship): Promise<void> {
    const update: Partial<Friendship> = {
      status: 'pending',
      updatedAt: new Date(),
    };
    await this.friendshipRepository.update(friendship.id, update);
  }

  private async createNewFriendship(userId: string, addresseeId: string): Promise<void> {
    const friendship: Partial<Friendship> = {
      requesterId: userId,
      addresseeId: addresseeId,
      status: 'pending',
      createdAt: new Date(),
    };
    const created = await this.friendshipRepository.save(friendship);
    this.logger.log(`Friendship request created with id ${created.id}`);
  }
}
