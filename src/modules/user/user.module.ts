import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './interfaces/http/user.controller';
import { UserModel, UserSchema } from './infrastructure/persistence/models/user.model';
import { KeycloakUserSearchClient } from './infrastructure/api-clients/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { MongoFriendshipRepository } from './infrastructure/db/mongo-friendship.repository';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/models/friendship.model';
import { MongoUserRepository } from './infrastructure/db/mongo-user.repository';
import { TerminusModule } from '@nestjs/terminus';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from '../shared/shared.module';
import { KafkaUserEventConsumer } from './infrastructure/messaging/kafka.user-event-consumer';
import { GetUserHandler } from './application/cqrs/handlers/get-user.handler';

@Module({
  imports: [
    TerminusModule,
    CqrsModule,
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: FriendshipModel.name, schema: FriendshipSchema },
    ]),
    AuthModule,
    SharedModule,
  ],
  controllers: [UserController, KafkaUserEventConsumer],
  providers: [
    GetUserHandler,
    {
      provide: 'UserRepository',
      useClass: MongoUserRepository,
    },
    {
      provide: 'FriendshipRepository',
      useClass: MongoFriendshipRepository,
    },
    {
      provide: 'UserSearchPort',
      useClass: KeycloakUserSearchClient,
    },
  ],
})
export class UserModule {}
