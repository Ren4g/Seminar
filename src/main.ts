import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import path from 'node:path';
import express from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] });
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().use('/media', express.static(path.resolve(process.env.MEDIA_DIR ?? 'storage')));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
