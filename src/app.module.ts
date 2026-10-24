import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/shared/infrastructure/security/auth.module';
import { SharedModule } from './modules/shared/shared.module';
import { ActivationCodeModule } from './modules/activation-code/activation-code.module';
import { FriendshipModule } from './modules/friendship/friendship.module';
import { MessageModule } from './modules/user-message/user-message.module';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RMU_MONGO_USERS_URI'),
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    UserModule,
    ActivationCodeModule,
    FriendshipModule,
    MessageModule,
    AuthModule,
  ],
})
export class AppModule {}
