import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { ActivateActivationCodeHandler } from './application/cqrs/handlers/activate-activation-code.handler.js';
import { CreateActivationCodeHandler } from './application/cqrs/handlers/create-activation-code.handler.js';
import { DeleteActivationCodeHandler } from './application/cqrs/handlers/delete-activation-code.handler.js';
import { GetActivationCodeHandler } from './application/cqrs/handlers/get-activation-code.handler.js';
import { ListActivationCodesHandler } from './application/cqrs/handlers/list-activation-codes.handler.js';
import { UpdateActivationCodeHandler } from './application/cqrs/handlers/update-activation-code.handler.js';
import { MongoActivationCodeRepository } from './infrastructure/db/mongo.activation-code.repository.js';
import { ActivationCodeModel, ActivationCodeSchema } from './infrastructure/persistence/models/activation-code.model.js';
import { ActivationCodeController } from './interfaces/http/activation-code.controller.js';
import { UserModule } from '../user/user.module.js';
import { ActivationCodeRepository } from './application/ports/activation-code-repository.port.js';
import { CheckActivationCodeHandler } from './application/cqrs/handlers/check-activation-code.handler.js';
import { ActivationCodeGuardAdapter } from './infrastructure/security/activation-code-guard.adapter.js';

const CommandHandlers = [
  ActivateActivationCodeHandler,
  CreateActivationCodeHandler,
  DeleteActivationCodeHandler,
  UpdateActivationCodeHandler,
];

const QueryHandlers = [GetActivationCodeHandler, ListActivationCodesHandler, CheckActivationCodeHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: ActivationCodeModel.name, schema: ActivationCodeSchema }]),
    AuthModule,
    SharedModule,
    UserModule,
  ],
  controllers: [ActivationCodeController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ActivationCodeGuardAdapter,
    {
      provide: ActivationCodeRepository,
      useClass: MongoActivationCodeRepository,
    },
  ],
})
export class ActivationCodeModule {}
