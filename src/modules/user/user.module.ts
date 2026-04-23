import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { KafkaConsumerController } from './infrastructure/messaging/kafka-consumer.controller';
import { UserController } from './infrastructure/controllers/user.controller';
import { UserSettingsModel, UserSettingsSchema } from './infrastructure/persistence/user-settings.schema';
import { KeycloakUserSearchClient } from './infrastructure/client/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { FriendshipRequestUseCase } from './application/cqrs/handlers/friendship-request.usecase';
import { MongoFriendshipRepository } from './infrastructure/db/mongo-friendship.repository';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/friendship.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSettingsModel.name, schema: UserSettingsSchema },
      { name: FriendshipModel.name, schema: FriendshipSchema },
    ]),
    AuthModule,
  ],
  controllers: [UserController, KafkaConsumerController],
  providers: [
    KafkaProducerService,
    FriendshipRequestUseCase,
    // {
    //   provide: 'UserSettingsRepository',
    //   useClass: MongoUserSettingsRepository,
    // },
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
