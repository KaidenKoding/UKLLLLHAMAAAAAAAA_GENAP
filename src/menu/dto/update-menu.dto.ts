// src/menu/dto/update-menu.dto.ts
// PartialType membuat semua field dari CreateMenuDto menjadi opsional
import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}