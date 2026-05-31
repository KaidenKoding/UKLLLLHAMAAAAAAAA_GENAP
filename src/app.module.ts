// src/app.module.ts
// Root module — tempat semua modul digabungkan

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    // ConfigModule.forRoot() agar .env bisa dibaca di seluruh aplikasi
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,      // Global module — PrismaService tersedia di mana saja
    AuthModule,        // Registrasi & Login + JWT
    MenuModule,        // CRUD Menu
    TransactionModule, // Proses Transaksi & Laporan
  ],
})
export class AppModule {}