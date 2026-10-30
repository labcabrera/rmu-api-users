import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from './modules/shared/infrastructure/security/auth.module.js';
import { SharedModule } from './modules/shared/shared.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { ActivationCodeModule } from './modules/activation-code/activation-code.module.js';
import { FriendshipModule } from './modules/friendship/friendship.module.js';
import { MessageModule } from './modules/user-message/user-message.module.js';
import { envSchema } from './config/env.schema.js';

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
    StatsModule,
    UserModule,
    ActivationCodeModule,
    FriendshipModule,
    MessageModule,
    AuthModule,
  ],
})
export class AppModule {}
