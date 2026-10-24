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
import { MongoFriendshipRepository } from './infrastructure/db/mongo.friendship.repository.js';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/models/friendship.model.js';
import { FriendshipController } from './interfaces/http/friendship.controller.js';
import { UserModule } from '../user/user.module.js';

import { FRIENDSHIP_REPOSITORY } from './application/ports/friendship-repository.port.js';
const CommandHandlers = [CreateFriendshipRequestHandler, DeleteFriendshipHandler, UpdateFriendshipHandler];
const QueryHandlers = [GetFriendshipHandler, ListFriendshipsHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: FriendshipModel.name, schema: FriendshipSchema }]),
    AuthModule,
    SharedModule,
    UserModule,
  ],
  controllers: [FriendshipController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: FRIENDSHIP_REPOSITORY,
      useClass: MongoFriendshipRepository,
    },
  ],
})
export class FriendshipModule {}
