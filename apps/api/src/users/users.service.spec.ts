import { UsersService } from './users.service';

describe('UsersService', () => {
  let prisma: any;
  let taxonomy: any;
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    taxonomy = {
      listLeafInterests: jest.fn(),
    };
    service = new UsersService(prisma, taxonomy);
  });

  it('returns false for an incomplete profile', () => {
    expect(
      service.isProfileComplete({
        avatarUrl: null,
        bio: 'Has a bio',
        interests: [{ id: '1' }],
      }),
    ).toBe(false);
    expect(
      service.isProfileComplete({
        avatarUrl: 'https://img.test/avatar.png',
        bio: '',
        interests: [{ id: '1' }],
      }),
    ).toBe(false);
    expect(
      service.isProfileComplete({
        avatarUrl: 'https://img.test/avatar.png',
        bio: 'Has a bio',
        interests: [],
      }),
    ).toBe(false);
  });

  it('returns true for a complete profile', () => {
    expect(
      service.isProfileComplete({
        avatarUrl: 'https://img.test/avatar.png',
        bio: 'Curious soul',
        interests: [{ id: '1' }],
      }),
    ).toBe(true);
  });

  it('creates and returns a new user for a new supabaseAuthId', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'local-user-1',
      supabaseAuthId: 'supabase-user-1',
      email: 'new@example.com',
    });

    const user = await service.findOrCreateUser({
      supabaseAuthId: 'supabase-user-1',
      email: 'new@example.com',
      name: 'New User',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        supabaseAuthId: 'supabase-user-1',
        email: 'new@example.com',
        name: 'New User',
        alias: 'New User',
      }),
    });
    expect(user.id).toBe('local-user-1');
  });

  it('returns an existing user without duplicating it', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'local-user-2',
      supabaseAuthId: 'supabase-user-2',
      email: 'existing@example.com',
    });

    const user = await service.findOrCreateUser({
      supabaseAuthId: 'supabase-user-2',
      email: 'existing@example.com',
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(user.id).toBe('local-user-2');
  });
});
