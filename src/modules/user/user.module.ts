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
import { UserSettingsController } from './infrastructure/controllers/user-settings.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }])],
  controllers: [UserManagementController, UserSettingsController, KafkaConsumerController],
  providers: [
    KafkaProducerService,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },
    {
      provide: 'UserSettingsRepositoryPort',
      useClass: UserSettingsRepository,
    },
    RsqlParser,
  ],
})
export class UserModule {}
