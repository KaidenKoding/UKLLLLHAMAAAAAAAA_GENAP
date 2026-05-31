// src/prisma/prisma.service.ts
// Service ini menginisialisasi koneksi ke database via Prisma Client
// dan di-share ke seluruh modul menggunakan PrismaModule (global)

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Buka koneksi saat aplikasi NestJS pertama kali diinisialisasi
  async onModuleInit() {
    await this.$connect();
  }

  // Tutup koneksi saat aplikasi NestJS di-shutdown
  async onModuleDestroy() {
    await this.$disconnect();
  }
}