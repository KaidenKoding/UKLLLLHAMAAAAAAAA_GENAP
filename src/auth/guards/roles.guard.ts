// src/auth/guards/roles.guard.ts
// Guard ini mengecek apakah user yang sudah login memiliki role yang sesuai
// dengan yang didefinisikan di @Roles() decorator pada endpoint.

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Ambil role yang dibutuhkan dari metadata decorator @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika tidak ada @Roles decorator, izinkan semua user yang sudah login
    if (!requiredRoles) {
      return true;
    }

    // Ambil data user dari request (sudah di-set oleh JwtStrategy.validate())
    const { user } = context.switchToHttp().getRequest();

    // Cek apakah role user ada di list role yang diizinkan
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Akses ditolak. Endpoint ini hanya untuk: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}