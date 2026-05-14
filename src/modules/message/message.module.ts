import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/modules/auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { CreateUserMessageHandler } from './application/cqrs/handlers/create-user-message.handler';
import { DeleteUserMessageHandler } from './application/cqrs/handlers/delete-user-message.handler';
import { ListUnreadUserMessagesHandler } from './application/cqrs/handlers/list-unread-user-messages.handler';
import { MarkUserMessageReadHandler } from './application/cqrs/handlers/mark-user-message-read.handler';
import { MongoUserMessageRepository } from './infrastructure/db/mongo-user-message.repository';
import { UserMessageModel, UserMessageSchema } from './infrastructure/persistence/models/user-message.model';
import { MessageController } from './interfaces/http/message.controller';
import { UserMessageRepository } from './application/ports/user-message.repository';
import { UserModule } from '../user/user.module';

const CommandHandlers = [CreateUserMessageHandler, DeleteUserMessageHandler, MarkUserMessageReadHandler];
const QueryHandlers = [ListUnreadUserMessagesHandler];

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
      provide: UserMessageRepository,
      useClass: MongoUserMessageRepository,
    },
  ],
})
export class MessageModule {}
