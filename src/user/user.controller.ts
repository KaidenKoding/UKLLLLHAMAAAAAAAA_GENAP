// src/user/user.controller.ts
import { Controller, Get, Req, UseGuards, Body, Post, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

// Interface bawaan biar TypeScript gak marah saat manggil req.user.id
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('api') // KITA KOSONGKAN DI SINI biar rutenya fleksibel sesuai request FE
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1. Menyelaraskan ke GET api/users (Sesuai request FE setelah login)
  @Get('users')
  @Roles('KASIR') // Hanya kasir yang bisa lihat semua daftar user/pembeli
  async getAllUsers() {
    return this.userService.findAll();
  }

  // 2. Menyelaraskan ke GET api/me (Sesuai request FE saat pertama kali load)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.findMe(req.user.id);
  }

  // 3. Fitur Top Up - Diisi oleh KASIR untuk PEMBELI tertentu
  // URL: POST /api/user/:id/topup
  @Post('user/:id/topup')
  @Roles('KASIR') // 🔥 Hanya KASIR yang boleh mencet tombol Top Up Saldo di FE!
  async topUp(
    @Param('id') id: string, // <-- Mengambil ID Pembeli yang dipilih Kasir dari URL
    @Body('amount') amount: number, // <-- Mengambil nominal dari input modal FE
  ) {
    // Mengubah string id dari URL menjadi number (+id) untuk dimasukkan ke Prisma
    return this.userService.topUp(+id, amount);
  }
}