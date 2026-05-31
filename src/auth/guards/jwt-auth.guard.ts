// src/auth/guards/jwt-auth.guard.ts
// Guard ini memastikan setiap request sudah menyertakan JWT Token yang valid.
// Gunakan sebagai @UseGuards(JwtAuthGuard) di controller.

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}