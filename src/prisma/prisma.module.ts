// src/prisma/prisma.module.ts
// Module ini di-set sebagai @Global() agar PrismaService bisa dipakai
// di seluruh module tanpa perlu di-import satu per satu

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <-- Membuat PrismaService tersedia secara global
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}