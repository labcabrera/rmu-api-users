/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DomainExceptionFilter } from './modules/user/infrastructure/controllers/domain-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const openApiConfig = new DocumentBuilder().setTitle('User API').setDescription('API para gestión de usuarios').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api-docs', app, document);

  const kafkaDisabled = app.get(ConfigService).get<boolean>('DEV_KAFKA_DISABLED');
  if (!kafkaDisabled) {
    const clientId = app.get(ConfigService).get<string>('KAFKA_CLIENT_ID') || 'rmu-api-users';
    const brokers = app.get(ConfigService).get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];
    const consumerGroupId = app.get(ConfigService).get<string>('KAFKA_CONSUMER_GROUP_ID') || 'user-consumer';
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: clientId,
          brokers: brokers,
        },
        consumer: {
          groupId: consumerGroupId,
        },
      },
    });
  }
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(3010);
  await app.startAllMicroservices();
}
bootstrap();
