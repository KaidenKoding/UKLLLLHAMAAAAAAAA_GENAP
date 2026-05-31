// src/main.ts
// Entry point aplikasi NestJS

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tambahkan prefix global '/api' untuk semua endpoint
  app.setGlobalPrefix('api');

  // Aktifkan ValidationPipe secara global
  // - whitelist: true → tolak field yang tidak ada di DTO
  // - forbidNonWhitelisted: true → throw error jika ada field asing
  // - transform: true → otomatis transform tipe data (string → number, dll)
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

const config = new DocumentBuilder()
    .setTitle('Mie Gacoan API')
    .setDescription('Dokumentasi API untuk Sistem Transaksi Mie Gacoan - UKL SMK')
    .setVersion('1.0')
    .addBearerAuth() // Penting buat ngetes JWT di Swagger
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Ini alamat aksesnya nant
    
  

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`🍜 Mie Gacoan API berjalan di: http://localhost:${port}/api`);
}

bootstrap();