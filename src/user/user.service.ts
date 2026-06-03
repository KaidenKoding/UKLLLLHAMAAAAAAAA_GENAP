import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ 
      where: { role: 'PEMBELI' } 
    });
  }

  async findMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  async topUpSaldo(userId: number, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User dengan ID ${userId} tidak ditemukan`);
    }

    // 🔥 Tambahkan saldo lama dengan nominal top up baru
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }
}
