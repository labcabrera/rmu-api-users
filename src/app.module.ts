import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './modules/shared/shared.module';
import { ActivationCodeModule } from './modules/activation-code/activation-code.module';
import { FriendshipModule } from './modules/friendship/friendship.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    AuthModule,
  ],
})
export class AppModule {}
