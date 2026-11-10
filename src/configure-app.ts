import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggingInterceptor } from './logging.interceptor.js';

// Shared by main.ts and the e2e tests, so tests run the same pipes and
// interceptors as the real server.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    // Applies @Exclude(), so a user's password hash never reaches a response.
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
}
