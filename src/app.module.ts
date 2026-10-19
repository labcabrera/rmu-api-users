import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './modules/shared/shared.module';
import { ActivationCodeModule } from './modules/activation-code/activation-code.module';
import { FriendshipModule } from './modules/friendship/friendship.module';
import { MessageModule } from './modules/user-message/user-message.module';
import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3010),
  RMU_MONGO_USERS_URI: Joi.string().required(),
  RMU_IAM_JWK_URI: Joi.string().uri().required(),
  RMU_IAM_ISSUER_URI: Joi.string().uri().required(),
  RMU_IAM_AUDIENCE: Joi.string().required(),
  RMU_IAM_TOKEN_URI: Joi.string().uri().required(),
  RMU_IAM_ADMIN_URI: Joi.string().uri().required(),
  RMU_IAM_CLIENT_ID: Joi.string().required(),
  RMU_IAM_CLIENT_SECRET: Joi.string().required(),
  RMU_KAFKA_BROKERS: Joi.string().required(),
  RMU_KAFKA_CLIENT_ID: Joi.string().required(),
  RMU_KAFKA_DEFAULT_PARTITIONS: Joi.number().integer().min(1).default(1),
  RMU_USERS_ACTIVATION_CODE_SIZE: Joi.number().integer().min(4).max(64).default(8),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
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
