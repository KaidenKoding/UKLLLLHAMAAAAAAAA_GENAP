// src/auth/strategies/jwt.strategy.ts
// Strategi Passport untuk memvalidasi JWT Token.
// Ketika request masuk dengan Authorization: Bearer <token>,
// NestJS akan otomatis menjalankan validate() ini.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Ambil token dari header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Dipanggil otomatis setelah token berhasil di-decode
  // Mengembalikan data user yang akan ditempel ke request.user
  async validate(payload: { sub: number; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Token tidak valid atau user tidak ditemukan');
    }

    // Hapus password sebelum di-attach ke request
    const { password, ...result } = user;
    return result;
  }
}