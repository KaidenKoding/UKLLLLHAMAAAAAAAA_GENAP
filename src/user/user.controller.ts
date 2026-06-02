// src/user/user.controller.ts
import { Controller, Get, Req, UseGuards, Body, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

// JANGAN ISI APAPUN DI DALAM @Controller() JIKA DI main.ts SUDAH ADA GLOBAL PREFIX 'api'
@Controller() 
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Frontend minta: /api/users
  // Karena global prefix-nya 'api', kita cukup tulis 'users' saja di sini!
  @Get('users')
  @Roles('KASIR')
  async getAllUsers() {
    return this.userService.findAll();
  }

  // Frontend minta: /api/me
  // Cukup tulis 'me' saja di sini, NestJS otomatis menggabungkannya jadi /api/me
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.findMe(req.user.id);
  }

  // Frontend minta: /api/user/topup
  @Post('user/topup')
  @Roles('PEMBELI')
  async topUp(
    @Req() req: AuthenticatedRequest,
    @Body('amount') amount: number,
  ) {
    return this.userService.topUp(req.user.id, amount);
  }
}