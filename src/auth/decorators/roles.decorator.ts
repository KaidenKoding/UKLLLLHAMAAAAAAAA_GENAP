// src/auth/decorators/roles.decorator.ts
// Custom decorator untuk menandai endpoint dengan role yang diizinkan
// Contoh penggunaan: @Roles(Role.KASIR)

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Fungsi decorator yang menerima satu atau lebih Role sebagai argumen
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);