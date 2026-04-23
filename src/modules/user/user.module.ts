import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { KafkaConsumerController } from './infrastructure/messaging/kafka-consumer.controller';
import { UserController } from './infrastructure/controllers/user.controller';
import { UserModel, UserSchema } from './infrastructure/persistence/models/user.model';
import { KeycloakUserSearchClient } from './infrastructure/client/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { MongoFriendshipRepository } from './infrastructure/db/mongo-friendship.repository';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/models/friendship.model';
import { MongoUserRepository } from './infrastructure/db/mongo-user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: FriendshipModel.name, schema: FriendshipSchema },
    ]),
    AuthModule,
  ],
  controllers: [UserController, KafkaConsumerController],
  providers: [
    KafkaProducerService,
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
