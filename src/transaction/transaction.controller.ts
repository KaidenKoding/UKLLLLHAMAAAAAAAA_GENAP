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

  @Roles(Role.PEMBELI)
  @Post()
  createOrder(@Req() req: Request, @Body() dto: CreateTransactionDto) {
    const userId = (req.user as any).id;
    return this.transactionService.createOrder(userId, dto);
  }

  @Roles(Role.KASIR)
  @Get()
  getAllOrders() {
    return this.transactionService.getAllOrders();
  }

  @Roles(Role.KASIR)
  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.getOrderById(id);
  }
}