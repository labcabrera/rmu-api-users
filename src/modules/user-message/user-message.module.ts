import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { CreateUserMessageHandler } from './application/cqrs/handlers/create-user-message.handler.js';
import { DeleteUserMessageHandler } from './application/cqrs/handlers/delete-user-message.handler.js';
import { GetUserMessagesHandler } from './application/cqrs/handlers/get-user-messages.handler.js';
import { MarkUserMessageReadHandler } from './application/cqrs/handlers/mark-user-message-read.handler.js';
import { MongoUserMessageRepository } from './infrastructure/db/mongo.user-message.repository.js';
import { UserMessageModel, UserMessageSchema } from './infrastructure/persistence/models/user-message.model.js';
import { MessageController } from './interfaces/http/user-message.controller.js';
import { USER_MESSAGE_REPOSITORY } from './application/ports/user-message-repository.port.js';
import { UserModule } from '../user/user.module.js';

const CommandHandlers = [CreateUserMessageHandler, DeleteUserMessageHandler, MarkUserMessageReadHandler];
const QueryHandlers = [GetUserMessagesHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: UserMessageModel.name, schema: UserMessageSchema }]),
    AuthModule,
    SharedModule,
    UserModule,
  ],
  controllers: [MessageController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: USER_MESSAGE_REPOSITORY,
      useClass: MongoUserMessageRepository,
    },
  ],
})
export class MessageModule {}
