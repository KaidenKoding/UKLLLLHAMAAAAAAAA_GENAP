// src/transaction/transaction.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // POST /transactions → Hanya PEMBELI yang bisa buat order
  @Roles(Role.PEMBELI)
  @Post()
  createOrder(@Req() req: Request, @Body() dto: CreateTransactionDto) {
    // req.user di-set oleh JwtStrategy.validate() dan berisi data user yang login
    const userId = (req.user as any).id;
    return this.transactionService.createOrder(userId, dto);
  }

  // GET /transactions → Hanya KASIR yang bisa lihat semua transaksi (laporan)
  @Roles(Role.KASIR)
  @Get()
  getAllOrders() {
    return this.transactionService.getAllOrders();
  }

  // GET /transactions/:id → Hanya KASIR yang bisa lihat detail transaksi
  @Roles(Role.KASIR)
  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.getOrderById(id);
  }
}