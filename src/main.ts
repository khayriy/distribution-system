import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('api');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shipping & Distribution Management API')
    .setDescription(
      'API documentation for the Shipping & Distribution Management System.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('port'));
}

void bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred.';
  console.error(`Application startup failed: ${message}`);
  process.exitCode = 1;
});
