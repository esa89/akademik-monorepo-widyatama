import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Support URL-encoded bodies (oidc-client-ts sends form-urlencoded to token endpoint)
  // express is available via @nestjs/platform-express
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.use(require('express').urlencoded({ extended: true }));

  // CORS - allow localhost and nip.io aliases
  app.enableCors({
    origin: [
      'http://localhost:5174',
      'http://localhost:6173',
      'http://localhost:5175',
      'http://localhost:6174',
      'http://localhost:6175',
      // nip.io aliases
      /^https?:\/\/.*\.127\.0\.0\.1\.nip\.io(:\d+)?$/,
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3013;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API Identity (NestJS) running on port ${port}`);
  console.log(`🔗 Authentik URL: ${process.env.AUTHENTIK_URL || 'http://localhost:9010'}`);
}

bootstrap();
