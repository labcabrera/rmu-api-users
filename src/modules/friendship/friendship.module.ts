import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/modules/auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { CreateFriendshipRequestHandler } from './application/cqrs/handlers/create-friendship-request.handler';
import { DeleteFriendshipHandler } from './application/cqrs/handlers/delete-friendship.handler';
import { GetFriendshipHandler } from './application/cqrs/handlers/get-friendship.handler';
import { ListFriendshipsHandler } from './application/cqrs/handlers/list-friendships.handler';
import { UpdateFriendshipHandler } from './application/cqrs/handlers/update-friendship.handler';
import { MongoFriendshipRepository } from './infrastructure/db/mongo-friendship.repository';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/models/friendship.model';
import { FriendshipController } from './interfaces/http/friendship.controller';

const CommandHandlers = [CreateFriendshipRequestHandler, DeleteFriendshipHandler, UpdateFriendshipHandler];
const QueryHandlers = [GetFriendshipHandler, ListFriendshipsHandler];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: FriendshipModel.name, schema: FriendshipSchema }]), AuthModule, SharedModule],
  controllers: [FriendshipController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'FriendshipRepository',
      useClass: MongoFriendshipRepository,
    },
  ],
})
export class FriendshipModule {}
