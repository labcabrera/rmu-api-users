import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { KafkaConsumerController } from './infrastructure/messaging/kafka-consumer.controller';
import { RsqlParser } from './infrastructure/controllers/rsql-parser';
import { UserSettingsRepository } from './infrastructure/persistence/user-settings.repository';
import { UserController } from './infrastructure/controllers/user.controller';
import { GetUserUserSettingsUseCase } from './application/use-cases/get-user-settings.usecase';
import { UserSettingsModel, UserSettingsSchema } from './infrastructure/persistence/user-settings.schema';
import { UpdateUserUserSettingsUseCase } from './application/use-cases/update-settings.usecase';
import { KeycloakUserSearchClient } from './infrastructure/client/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { FriendshipRequestUseCase } from './application/use-cases/request-friend.usecase';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserSettingsModel.name, schema: UserSettingsSchema }]), AuthModule],
  controllers: [UserController, KafkaConsumerController],
  providers: [
    KafkaProducerService,
    GetUserUserSettingsUseCase,
    UpdateUserUserSettingsUseCase,
    FriendshipRequestUseCase,
    RsqlParser,
    {
      provide: 'UserSettingsRepositoryPort',
      useClass: UserSettingsRepository,
    },
    {
      provide: 'UserSearchPort',
      useClass: KeycloakUserSearchClient,
    },
  ],
})
export class UserModule {}
