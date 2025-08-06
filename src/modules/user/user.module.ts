import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './infrastructure/persistence/user.schema';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { KafkaProducerService } from './infrastructure/messaging/kafka-producer.service';
import { KafkaConsumerController } from './infrastructure/messaging/kafka-consumer.controller';
import { UserManagementController } from './infrastructure/controllers/user-management.controller';
import { DeleteUserUseCase } from './application/use-cases/delete-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { RsqlParser } from './infrastructure/controllers/rsql-parser';
import { UserSettingsRepository } from './infrastructure/persistence/user-settings.repository';
import { UserController } from './infrastructure/controllers/user.controller';
import { GetUserUserSettingsUseCase } from './application/use-cases/get-user-settings.usecase';
import { UserSettingsModel, UserSettingsSchema } from './infrastructure/persistence/user-settings.schema';
import { UpdateUserUserSettingsUseCase } from './application/use-cases/update-settings.usecase';
import { KeycloakUserSearchClient } from './infrastructure/client/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { RequestFriendUseCase } from './application/use-cases/request-friend.usecase';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: UserSettingsModel.name, schema: UserSettingsSchema },
    ]),
    AuthModule,
  ],
  controllers: [UserManagementController, UserController, KafkaConsumerController],
  providers: [
    KafkaProducerService,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserUserSettingsUseCase,
    UpdateUserUserSettingsUseCase,
    RequestFriendUseCase,
    RsqlParser,
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },
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
