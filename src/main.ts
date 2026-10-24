import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureHttp } from './bootstrap/http.js';
import { configureLogger } from './bootstrap/logger.js';
import { configureOpenApi } from './bootstrap/openapi.js';

// users only publishes to Kafka (KafkaProducerService): it has no consumers, so no microservice is connected.
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: configureLogger(process.env.LOG_LEVEL) });
  configureHttp(app);
  configureOpenApi(app);
  await app.listen(app.get(ConfigService).get<number>('PORT')!);
}

// A failed start (Mongo, Kafka, a port in use) ends the process, so the container restarts instead of hanging.
bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').fatal(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
