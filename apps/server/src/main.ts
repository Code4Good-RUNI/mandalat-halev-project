/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { join } from 'path';
import { config as loadEnv } from '@dotenvx/dotenvx';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { generateOpenApi } from '@ts-rest/open-api';
import { userContract } from '@mandalat-halev-project/api-interfaces';

// Encrypted values need @dotenvx/dotenvx (not plain dotenv). Paths are relative to
// main's location (src/ or dist/) so apps/server/.env.server always resolves.
const serverEnvDir = join(__dirname, '..');
loadEnv({
  path: [
    join(serverEnvDir, '.env.server'),
    join(serverEnvDir, '.env.server.local'),
  ],
  envKeysFile: join(serverEnvDir, '.env.keys'),
  ignore: ['MISSING_ENV_FILE'],
  overload: true,
  quiet: true,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [];
  app.enableCors({
    origin: corsOrigin,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(new (await import('@nestjs/common')).ValidationPipe({ 
    transform: true, 
    whitelist: true 
  }));
  
  const port = process.env.PORT || 3000;

  // Swagger
  const document = generateOpenApi(userContract, {
    info: {
      title: 'Mandalat Halev Project API',
      description:
        'API for the Mandalat Halev Project (Generated from ts-rest Contract)',
      version: '1.0.0',
    },
    servers: [{ url: '/api' }],
  });

  document.components = {
    ...document.components,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  };

  document.security = [{ bearerAuth: [] }];

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`📄 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
