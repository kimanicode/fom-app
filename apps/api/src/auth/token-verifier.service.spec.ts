jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'jwks'),
  jwtVerify: jest.fn(),
}));

import { UnauthorizedException } from '@nestjs/common';
import { jwtVerify } from 'jose';
import { TokenVerifierService } from './token-verifier.service';

describe('TokenVerifierService', () => {
  const jwtVerifyMock = jest.mocked(jwtVerify);

  let prisma: { user: { findUnique: jest.Mock } };
  let authService: { provisionSupabaseUser: jest.Mock };
  let service: TokenVerifierService;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    authService = {
      provisionSupabaseUser: jest.fn(),
    };
    service = new TokenVerifierService(prisma as never, authService as never);
  });

  it('resolves the correct local user for a valid Supabase JWT', async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: 'supabase-user-1',
        email: 'user@example.com',
      },
    } as never);
    prisma.user.findUnique.mockResolvedValue({
      id: 'local-user-1',
      email: 'user@example.com',
    });

    await expect(service.verify('valid-token')).resolves.toEqual({
      id: 'local-user-1',
      email: 'user@example.com',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { supabaseAuthId: 'supabase-user-1' },
    });
    expect(authService.provisionSupabaseUser).not.toHaveBeenCalled();
  });

  it('provisions and returns a local user when the JWT is valid but no user exists', async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: 'supabase-user-2',
        email: 'new@example.com',
        user_metadata: {
          full_name: 'New User',
          user_name: 'newbie',
          avatar_url: 'https://img.test/avatar.png',
        },
      },
    } as never);
    prisma.user.findUnique.mockResolvedValue(null);
    authService.provisionSupabaseUser.mockResolvedValue({
      id: 'local-user-2',
      email: 'new@example.com',
    });

    await expect(service.verify('valid-token')).resolves.toEqual({
      id: 'local-user-2',
      email: 'new@example.com',
    });
    expect(authService.provisionSupabaseUser).toHaveBeenCalledWith({
      supabaseAuthId: 'supabase-user-2',
      email: 'new@example.com',
      name: 'New User',
      alias: 'newbie',
      avatarUrl: 'https://img.test/avatar.png',
    });
  });

  it('throws UnauthorizedException for an expired JWT', async () => {
    jwtVerifyMock.mockRejectedValue(new Error('jwt expired'));

    await expect(service.verify('expired-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException for a malformed JWT', async () => {
    jwtVerifyMock.mockRejectedValue(new Error('malformed'));

    await expect(service.verify('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
