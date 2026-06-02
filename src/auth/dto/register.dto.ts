// src/auth/dto/register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  

  @IsNumber()
  @Min(0)
  @IsOptional()
  balance?: number; // Opsional, hanya relevan untuk PEMBELI
}