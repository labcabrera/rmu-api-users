import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { KafkaConsumerController } from './infrastructure/messaging/kafka-consumer.controller';
import { RsqlParser } from './infrastructure/controllers/rsql-parser';
import { MongoUserSettingsRepository } from './infrastructure/persistence/mongo-user-settings.repository';
import { UserController } from './infrastructure/controllers/user.controller';
import { GetUserUserSettingsUseCase } from './application/use-cases/get-user-settings.usecase';
import { UserSettingsModel, UserSettingsSchema } from './infrastructure/persistence/user-settings.schema';
import { UpdateUserUserSettingsUseCase } from './application/use-cases/update-settings.usecase';
import { KeycloakUserSearchClient } from './infrastructure/client/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { FriendshipRequestUseCase } from './application/use-cases/friendship-request.usecase';
import { MongoFriendshipRepository } from './infrastructure/persistence/mongo-friendship.repository';
import { FriendshipModel, FriendshipSchema } from './infrastructure/persistence/friendship.schema';

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
    GetUserUserSettingsUseCase,
    UpdateUserUserSettingsUseCase,
    FriendshipRequestUseCase,
    RsqlParser,
    {
      provide: 'UserSettingsRepository',
      useClass: MongoUserSettingsRepository,
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
