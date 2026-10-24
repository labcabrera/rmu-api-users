import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { GetUserHandler } from './application/cqrs/handlers/get-user.handler.js';
import { GetUsersHandler } from './application/cqrs/handlers/get-users.handler.js';
import { SearchUsersHandler } from './application/cqrs/handlers/search-users.handler.js';
import { UpdateCurrentUserHandler } from './application/cqrs/handlers/update-current-user.handler.js';
import { IAM_USER_PORT } from './application/ports/iam-user.port.js';
import { USER_REPOSITORY } from './application/ports/user-repository.port.js';
import { UserProvisioningService } from './application/services/user-provisioning.service.js';
import { KeycloakIamUserAdapter } from './infrastructure/api-clients/keycloak.iam-user.adapter.js';
import { MongoUserRepository } from './infrastructure/db/mongo.user.repository.js';
import { UserModel, UserSchema } from './infrastructure/persistence/models/user.model.js';
import { UserController } from './interfaces/http/user.controller.js';

export const USER_HANDLERS = [GetUserHandler, GetUsersHandler, SearchUsersHandler, UpdateCurrentUserHandler];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]), AuthModule, SharedModule],
  controllers: [UserController],
  providers: [
    ...USER_HANDLERS,
    UserProvisioningService,
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    { provide: IAM_USER_PORT, useClass: KeycloakIamUserAdapter },
  ],
  exports: [USER_REPOSITORY, IAM_USER_PORT, UserProvisioningService],
})
export class UserModule {}
