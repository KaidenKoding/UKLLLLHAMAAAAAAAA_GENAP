// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

const config = new DocumentBuilder()
    .setTitle('UKL KULINER API')
    .setDescription('UKL GACOAN WOOOO')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); 
    
  

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`API berjalan di http://localhost:${port}/api/hbb`);
}

bootstrap();