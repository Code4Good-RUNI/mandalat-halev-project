/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { config as loadEnv } from 'dotenv';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { generateOpenApi } from '@ts-rest/open-api';
import { userContract } from '@mandalat-halev-project/api-interfaces';

loadEnv({ path: 'env.server' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [];
  app.enableCors({
    origin: corsOrigin,
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  // Swagger
  const document = generateOpenApi(userContract, {
    info: {
      title: 'Mandalat Halev Project API',
      description: 'API for the Mandalat Halev Project (Generated from ts-rest Contract)',
      version: '1.0.0',
    },
    servers: [{ url: '/api' }],
  })

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
