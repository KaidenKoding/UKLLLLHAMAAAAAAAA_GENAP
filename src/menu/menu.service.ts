// src/menu/menu.service.ts
// Menangani CRUD operasi untuk data menu

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ─── CREATE ──────────────────────────────────────────────────
  async create(dto: CreateMenuDto) {
    const menu = await this.prisma.menu.create({ data: dto });
    return { message: 'Menu berhasil ditambahkan', menu };
  }

  // ─── READ ALL ─────────────────────────────────────────────────
  async findAll() {
    return this.prisma.menu.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── READ ONE ─────────────────────────────────────────────────
  async findOne(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }
    return menu;
  }

  // ─── UPDATE ──────────────────────────────────────────────────
  async update(id: number, dto: UpdateMenuDto) {
    await this.findOne(id); // Pastikan menu ada
    const updated = await this.prisma.menu.update({
      where: { id },
      data: dto,
    });
    return { message: 'Menu berhasil diperbarui', menu: updated };
  }

  // ─── DELETE ──────────────────────────────────────────────────
  async remove(id: number) {
    await this.findOne(id); // Pastikan menu ada
    await this.prisma.menu.delete({ where: { id } });
    return { message: `Menu dengan ID ${id} berhasil dihapus` };
  }
}