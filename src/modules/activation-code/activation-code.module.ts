import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/modules/auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { ActivateActivationCodeHandler } from './application/cqrs/handlers/activate-activation-code.handler';
import { CreateActivationCodeHandler } from './application/cqrs/handlers/create-activation-code.handler';
import { DeleteActivationCodeHandler } from './application/cqrs/handlers/delete-activation-code.handler';
import { GetActivationCodeHandler } from './application/cqrs/handlers/get-activation-code.handler';
import { ListActivationCodesHandler } from './application/cqrs/handlers/list-activation-codes.handler';
import { UpdateActivationCodeHandler } from './application/cqrs/handlers/update-activation-code.handler';
import { MongoActivationCodeRepository } from './infrastructure/db/mongo-activation-code.repository';
import { ActivationCodeModel, ActivationCodeSchema } from './infrastructure/persistence/models/activation-code.model';
import { ActivationCodeController } from './interfaces/http/activation-code.controller';

const CommandHandlers = [
  ActivateActivationCodeHandler,
  CreateActivationCodeHandler,
  DeleteActivationCodeHandler,
  UpdateActivationCodeHandler,
];
const QueryHandlers = [GetActivationCodeHandler, ListActivationCodesHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: ActivationCodeModel.name, schema: ActivationCodeSchema }]),
    AuthModule,
    SharedModule,
  ],
  controllers: [ActivationCodeController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'ActivationCodeRepository',
      useClass: MongoActivationCodeRepository,
    },
  ],
})
export class ActivationCodeModule {}
