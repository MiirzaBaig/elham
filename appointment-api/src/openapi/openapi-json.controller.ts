import { INestApplication } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { Express } from 'express';

export function setupOpenApiJsonRoute(
  app: INestApplication,
  document: OpenAPIObject,
) {
  const http = app.getHttpAdapter().getInstance() as Express;
  http.get('/openapi.json', (_req, res) => {
    res.json(document);
  });
}
