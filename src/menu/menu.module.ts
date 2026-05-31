// src/menu/menu.module.ts
import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';

@Module({
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}