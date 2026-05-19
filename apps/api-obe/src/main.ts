import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // CORS
  const corsOrigins = configService.get<string[]>('app.corsOrigins', ['*']);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
  });

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // API Prefix
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerEnabled = configService.get<boolean>('app.swagger.enabled', false);
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('SYSTAMA - OBE API')
      .setDescription('Outcome Based Education API Service for SYSTAMA')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = configService.get<string>('app.swagger.path', 'api/docs');
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('app.port', 3014);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 api-obe running on http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
