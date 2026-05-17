import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './interfaces/http/user.controller';
import { UserModel, UserSchema } from './infrastructure/persistence/models/user.model';
import { KeycloakIamUserAdapter } from './infrastructure/api-clients/keycloak-user-client';
import { AuthModule } from 'src/modules/auth/auth.module';
import { MongoUserRepository } from './infrastructure/db/mongo-user.repository';
import { TerminusModule } from '@nestjs/terminus';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from '../shared/shared.module';
import { KafkaUserEventConsumer } from './infrastructure/messaging/kafka.user-event-consumer';
import { GetUserHandler } from './application/cqrs/handlers/get-user.handler';
import { GetUsersHandler } from './application/cqrs/handlers/search-users.handler';
import { IamUserPort } from './application/ports/iam-user.port';
import { UserRepository } from './application/ports/user-repository';
import { UpdateCurrentUserHandler } from './application/cqrs/handlers/update-current-user.handler';

@Module({
  imports: [
    TerminusModule,
    CqrsModule,
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
    AuthModule,
    SharedModule,
  ],
  controllers: [UserController, KafkaUserEventConsumer],
  providers: [
    GetUserHandler,
    GetUsersHandler,
    UpdateCurrentUserHandler,
    {
      provide: UserRepository,
      useClass: MongoUserRepository,
    },
    {
      provide: IamUserPort,
      useClass: KeycloakIamUserAdapter,
    },
  ],
  exports: [UserRepository, IamUserPort],
})
export class UserModule {}
