import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { TextEncoder } from 'util';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

type VerifiedUser = {
  id: string;
  email?: string;
};

@Injectable()
export class TokenVerifierService {
  private readonly supabaseUrl = process.env.SUPABASE_URL?.trim();
  private readonly supabaseIssuer = this.supabaseUrl ? `${this.supabaseUrl}/auth/v1` : null;
  private readonly supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET?.trim();
  private readonly supabaseJwks = this.supabaseUrl
    ? createRemoteJWKSet(new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`))
    : null;
  private readonly sharedSecretKey = this.supabaseJwtSecret
    ? new TextEncoder().encode(this.supabaseJwtSecret)
    : null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async verify(token: string): Promise<VerifiedUser> {
    const supabaseUser = await this.verifySupabaseToken(token);
    if (supabaseUser) return supabaseUser;

    throw new UnauthorizedException('Invalid token');
  }

  private async verifySupabaseToken(token: string): Promise<VerifiedUser | null> {
    if (!this.supabaseIssuer) return null;

    try {
      const payload = await this.verifyWithSupabaseKey(token);
      return await this.resolveSupabaseUser(payload);
    } catch {
      return null;
    }
  }

  private async verifyWithSupabaseKey(token: string): Promise<JWTPayload> {
    if (this.sharedSecretKey) {
      try {
        const { payload } = await jwtVerify(token, this.sharedSecretKey, {
          issuer: this.supabaseIssuer!,
        });
        return payload;
      } catch {
        // Fall through to JWKS verification for projects using signing keys.
      }
    }

    if (this.supabaseJwks) {
      const { payload } = await jwtVerify(token, this.supabaseJwks, {
        issuer: this.supabaseIssuer!,
      });
      return payload;
    }

    throw new UnauthorizedException('Supabase token verification is not configured.');
  }

  private async resolveSupabaseUser(payload: JWTPayload): Promise<VerifiedUser | null> {
    const subject = payload.sub;
    if (!subject) return null;

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    let user = await this.prisma.user.findUnique({
      where: { supabaseAuthId: subject },
    });

    if (!user) {
      user = await this.authService.provisionSupabaseUser({
        supabaseAuthId: subject,
        email,
        name: typeof payload.user_metadata === 'object' && payload.user_metadata && typeof (payload.user_metadata as Record<string, unknown>).full_name === 'string'
          ? (payload.user_metadata as Record<string, string>).full_name
          : typeof payload.user_metadata === 'object' && payload.user_metadata && typeof (payload.user_metadata as Record<string, unknown>).name === 'string'
            ? (payload.user_metadata as Record<string, string>).name
            : undefined,
        alias: typeof payload.user_metadata === 'object' && payload.user_metadata && typeof (payload.user_metadata as Record<string, unknown>).user_name === 'string'
          ? (payload.user_metadata as Record<string, string>).user_name
          : undefined,
        avatarUrl: typeof payload.user_metadata === 'object' && payload.user_metadata && typeof (payload.user_metadata as Record<string, unknown>).avatar_url === 'string'
          ? (payload.user_metadata as Record<string, string>).avatar_url
          : undefined,
      });
    }

    return { id: user.id, email: user.email || email };
  }
}
