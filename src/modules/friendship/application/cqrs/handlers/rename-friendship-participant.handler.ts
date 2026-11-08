import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type FriendInviteRepository, FRIEND_INVITE_REPOSITORY } from '../../ports/friend-invite-repository.port.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { RenameFriendshipParticipantCommand } from '../commands/rename-friendship-participant.command.js';

@CommandHandler(RenameFriendshipParticipantCommand)
export class RenameFriendshipParticipantHandler implements ICommandHandler<RenameFriendshipParticipantCommand, void> {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(FRIEND_INVITE_REPOSITORY) private readonly friendInviteRepository: FriendInviteRepository,
  ) {}

  async execute(command: RenameFriendshipParticipantCommand): Promise<void> {
    await this.friendshipRepository.renameParticipant(command.userId, command.name);
    await this.friendInviteRepository.renameInviter(command.userId, command.name);
  }
}
