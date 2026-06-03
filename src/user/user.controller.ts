// src/user/user.controller.ts
import { Controller, Get, Req, UseGuards, Body, Post, Param, ParseIntPipe } from '@nestjs/common';
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

@Controller('') 
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @Roles('KASIR') 
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.findMe(req.user.id);
  }

  @Post('user/:id/topup')
  @Roles('KASIR') 
  async topUp(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ) {
    return this.userService.topUpSaldo(id, amount);
  }
  
}