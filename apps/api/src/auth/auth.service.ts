import { GoneException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthDto, LoginDto, SignupDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: SignupDto) {
    void dto;
    throw new GoneException('Password-based signup is disabled. Use Supabase Auth instead.');
  }

  async login(dto: LoginDto) {
    void dto;
    throw new GoneException('Password-based login is disabled. Use Supabase Auth instead.');
  }

  async google(dto: GoogleAuthDto) {
    void dto;
    throw new GoneException('API Google sign-in is disabled. Use Supabase Auth instead.');
  }

  async provisionSupabaseUser(params: {
    supabaseAuthId: string;
    email?: string;
    name?: string;
    alias?: string;
    avatarUrl?: string;
  }) {
    const email = params.email?.trim().toLowerCase();
    const name = params.name?.trim() || email?.split('@')[0] || 'Explorer';
    const alias = params.alias?.trim() || name;
    const avatarUrl = params.avatarUrl?.trim() || undefined;

    let user = await this.prisma.user.findUnique({
      where: { supabaseAuthId: params.supabaseAuthId },
    });

    if (user) {
      if ((!user.email && email) || (!user.name && name) || (!user.alias && alias) || (!user.avatarUrl && avatarUrl)) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email: user.email || email,
            name: user.name || name,
            alias: user.alias || alias,
            avatarUrl: user.avatarUrl || avatarUrl,
          },
        });
      }
      return user;
    }

    if (email) {
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        return this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            supabaseAuthId: params.supabaseAuthId,
            name: existingByEmail.name || name,
            alias: existingByEmail.alias || alias,
            avatarUrl: existingByEmail.avatarUrl || avatarUrl,
          },
        });
      }
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    return this.prisma.user.create({
      data: {
        supabaseAuthId: params.supabaseAuthId,
        email: email || `${params.supabaseAuthId}@supabase.local`,
        passwordHash,
        name,
        alias,
        avatarUrl,
      },
    });
  }

  async forgotPassword(email: string) {
    void email;
    // V1: no email integration yet. Return ok to avoid leaking user existence.
    return { ok: true };
  }
}
