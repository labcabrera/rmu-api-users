import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { CreateFriendshipRequestHandler } from './application/cqrs/handlers/create-friendship-request.handler.js';
import { DeleteFriendshipHandler } from './application/cqrs/handlers/delete-friendship.handler.js';
import { GetFriendshipHandler } from './application/cqrs/handlers/get-friendship.handler.js';
import { ListFriendshipsHandler } from './application/cqrs/handlers/list-friendships.handler.js';
import { UpdateFriendshipHandler } from './application/cqrs/handlers/update-friendship.handler.js';
import { GetFriendshipBetweenHandler } from './application/cqrs/handlers/get-friendship-between.handler.js';
import { MongoFriendshipRepository } from './infrastructure/db/mongo.friendship.repository.js';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/models/friendship.model.js';
import { FriendshipController } from './interfaces/http/friendship.controller.js';
import { UserModule } from '../user/user.module.js';
import { FriendshipGuard } from './infrastructure/security/friendship.guard.js';
import {
  AcceptFriendInviteHandler,
  CheckFriendInviteHandler,
  CreateFriendInviteHandler,
  DeleteFriendInviteHandler,
  ListFriendInvitesHandler,
} from './application/cqrs/handlers/friend-invite.handlers.js';
import { FRIEND_INVITE_REPOSITORY } from './application/ports/friend-invite-repository.port.js';
import { MongoFriendInviteRepository } from './infrastructure/db/mongo.friend-invite.repository.js';
import { FriendInviteModel, FriendInviteSchema } from './infrastructure/persistence/models/friend-invite.model.js';
import { FriendInviteController } from './interfaces/http/friend-invite.controller.js';

import { FRIENDSHIP_REPOSITORY } from './application/ports/friendship-repository.port.js';
const CommandHandlers = [
  CreateFriendshipRequestHandler,
  DeleteFriendshipHandler,
  UpdateFriendshipHandler,
  CreateFriendInviteHandler,
  DeleteFriendInviteHandler,
  AcceptFriendInviteHandler,
];
const QueryHandlers = [
  GetFriendshipHandler,
  ListFriendshipsHandler,
  GetFriendshipBetweenHandler,
  ListFriendInvitesHandler,
  CheckFriendInviteHandler,
];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: FriendshipModel.name, schema: FriendshipSchema },
      { name: FriendInviteModel.name, schema: FriendInviteSchema },
    ]),
    AuthModule,
    SharedModule,
    UserModule,
  ],
  controllers: [FriendshipController, FriendInviteController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    FriendshipGuard,
    {
      provide: FRIENDSHIP_REPOSITORY,
      useClass: MongoFriendshipRepository,
    },
    { provide: FRIEND_INVITE_REPOSITORY, useClass: MongoFriendInviteRepository },
  ],
  exports: [FRIENDSHIP_REPOSITORY],
})
export class FriendshipModule {}
