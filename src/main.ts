// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create NestJS app with raw body enabled
  const app = await NestFactory.create(AppModule, {
    rawBody: true // Enable raw body parsing for Stripe webhooks
  });

  // Configure CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Start server
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();