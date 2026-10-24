import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CreateFriendshipRequestCommand } from '../commands/create-friendship-request.command.js';
import { ConflictError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { Friendship } from '../../../domain/aggregates/friendship.js';
import { type FriendshipRepository, FRIENDSHIP_REPOSITORY } from '../../ports/friendship-repository.port.js';
import { type UserRepository, USER_REPOSITORY } from '../../../../user/application/ports/user-repository.port.js';
import { FriendshipGuard } from '../../../infrastructure/security/friendship.guard.js';
import { UserProvisioningService } from '../../../../user/application/services/user-provisioning.service.js';

@CommandHandler(CreateFriendshipRequestCommand)
export class CreateFriendshipRequestHandler implements ICommandHandler<CreateFriendshipRequestCommand, Friendship> {
  private readonly logger = new Logger(CreateFriendshipRequestHandler.name);

  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(UserProvisioningService) private readonly userProvisioning: UserProvisioningService,
    @Inject(FriendshipGuard) private readonly guard: FriendshipGuard,
  ) {}

  async execute(command: CreateFriendshipRequestCommand): Promise<Friendship> {
    this.guard.checkCreate(command.roles);
    const requester = await this.userRepository.findById(command.userId);
    if (!requester) {
      throw new ValidationError('Requester user not found');
    }
    // Falls back to the Keycloak admin API when the addressee never logged into RMU.
    const addressee = await this.userProvisioning.findOrProvisionByName(command.addresseeName.trim());
    if (!addressee) {
      throw new ValidationError('Addressee user not found');
    } else if (requester.id === addressee.id) {
      throw new ValidationError('Requester and addressee must be different users');
    }

    const current = await this.friendshipRepository.findByParticipants(command.userId, addressee.id);
    if (current) {
      switch (current.status) {
        case 'pending':
          throw new ConflictError('Friendship request already pending between users');
        case 'accepted':
          throw new ConflictError('Users are already friends');
        case 'rejected':
        //TODO invisible error?
      }
      throw new ConflictError('Not implemented friendship status');
    }
    const friendship = Friendship.create({
      requesterId: command.userId,
      requesterName: requester.name,
      addresseeId: addressee.id,
      addresseeName: addressee.name,
      message: command.message,
    });
    await this.friendshipRepository.save(friendship);
    return friendship;
  }
}
