// src/menu/menu.controller.ts
// Semua endpoint menu dilindungi JWT + Role KASIR,
// kecuali GET (melihat menu) yang bisa diakses semua user yang login

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

// Semua endpoint di controller ini butuh login (JWT)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // POST /menus → Hanya KASIR
  @Roles(Role.KASIR)
  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  // GET /menus → Semua user yang login bisa lihat (KASIR & PEMBELI)
  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  // GET /menus/:id → Semua user yang login
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findOne(id);
  }

  // PUT /menus/:id → Hanya KASIR
  @Roles(Role.KASIR)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto);
  }

  // DELETE /menus/:id → Hanya KASIR
  @Roles(Role.KASIR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.remove(id);
  }
}