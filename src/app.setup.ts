import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from './modules/shared/interfaces/http/domain-exception.filter';

/** HTTP pipeline shared by main.ts and the e2e tests. */
export function configureApp(app: INestApplication): void {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
}
