import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve uploaded files via Express route (outside global prefix)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/uploads/:filename', (req: any, res: any) => {
    const filename = req.params.filename;
    const filePath = join(process.cwd(), 'uploads', filename);
    if (filename.includes('..') || !existsSync(filePath)) {
      res.status(404).json({ statusCode: 404, message: 'File not found' });
      return;
    }
    createReadStream(filePath).pipe(res);
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global Interceptors & Filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') ?? [
    'http://localhost:3000',
    'http://localhost:4200',
    'https://serveiq-admin.vercel.app',
    'https://serve-iq-one.vercel.app',
    'https://serve-iq-waiter.vercel.app',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('ServeIQ API')
    .setDescription(
      'Multi-tenant hospitality platform API — manage businesses, branches, menus, tables, tabs, orders, and bills.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`\n📚 Swagger UI → http://localhost:${process.env.PORT ?? 3000}/api/docs\n`);
}
bootstrap();
