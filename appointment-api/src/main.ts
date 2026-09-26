import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupOpenApiJsonRoute } from './openapi/openapi-json.controller';
import { join } from 'path';
import { readFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Appointment Booking API')
    .setDescription(
      [
        'One active booking per slot. No authentication.',
        '',
        'Socket.IO (path /socket.io, namespace /): after commit, emits slot.booked or slot.released with slotId, bookingId, available. No PII in events. No events on 4xx or repeat cancel. See readme.md.',
        '',
        'DELETE on an already cancelled booking returns 200 with the same body; no socket event.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerCss = readFileSync(
    join(__dirname, 'swagger', 'swagger-ui-overrides.css'),
    'utf8',
  );
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/openapi.json',
    customCss: swaggerCss,
  });
  setupOpenApiJsonRoute(app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
