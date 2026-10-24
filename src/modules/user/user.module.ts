import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../shared/infrastructure/security/auth.module';
import { SharedModule } from '../shared/shared.module';
import { GetUserHandler } from './application/cqrs/handlers/get-user.handler';
import { GetUsersHandler } from './application/cqrs/handlers/get-users.handler';
import { SearchUsersHandler } from './application/cqrs/handlers/search-users.handler';
import { UpdateCurrentUserHandler } from './application/cqrs/handlers/update-current-user.handler';
import { IamUserPort } from './application/ports/iam-user.port';
import { UserRepository } from './application/ports/user-repository.port';
import { UserProvisioningService } from './application/services/user-provisioning.service';
import { KeycloakIamUserAdapter } from './infrastructure/api-clients/keycloak.iam-user.adapter';
import { MongoUserRepository } from './infrastructure/db/mongo.user.repository';
import { UserModel, UserSchema } from './infrastructure/persistence/models/user.model';
import { UserController } from './interfaces/http/user.controller';

export const USER_HANDLERS = [GetUserHandler, GetUsersHandler, SearchUsersHandler, UpdateCurrentUserHandler];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]), AuthModule, SharedModule],
  controllers: [UserController],
  providers: [
    ...USER_HANDLERS,
    UserProvisioningService,
    { provide: UserRepository, useClass: MongoUserRepository },
    { provide: IamUserPort, useClass: KeycloakIamUserAdapter },
  ],
  exports: [UserRepository, IamUserPort, UserProvisioningService],
})
export class UserModule {}
