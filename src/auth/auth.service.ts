// src/auth/auth.service.ts
// Menangani logika registrasi dan login user

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── REGISTER ───────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Cek apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Hash password sebelum disimpan ke database (saltRounds = 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Simpan user baru ke database
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role ?? 'PEMBELI', // Default role: PEMBELI
        balance: dto.balance ?? 0,
      },
    });

    // Jangan kembalikan password ke client
    const { password, ...result } = user;
    return {
      message: 'Registrasi berhasil',
      user: result,
    };
  }

  // ─── LOGIN ───────────────────────────────────────────────────
  async login(dto: LoginDto) {
    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Bandingkan password yang dikirim dengan hash di database
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Buat JWT payload
    const payload = {
      sub: user.id,    // subject = id user
      email: user.email,
      role: user.role,
    };

    // Generate JWT token
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login berhasil',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}