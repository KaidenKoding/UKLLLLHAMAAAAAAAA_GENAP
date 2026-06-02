// src/app.module.ts
// Root module — tempat semua modul digabungkan

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,
    AuthModule,
    MenuModule,
    TransactionModule, UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }