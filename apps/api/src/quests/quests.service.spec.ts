import { BadRequestException, ConflictException } from '@nestjs/common';
import { QuestsService } from './quests.service';

describe('QuestsService', () => {
  let prisma: any;
  let notifications: any;
  let questEnrichment: any;
  let service: QuestsService;

  beforeEach(() => {
    process.env.PLATFORM_FEE_BPS = '1000';
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
      questTemplate: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      questInstance: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      questParticipant: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      paymentTransaction: {
        create: jest.fn(),
        update: jest.fn(),
      },
      userBehaviorSignal: {
        create: jest.fn(),
      },
    };
    notifications = {
      create: jest.fn(),
    };
    questEnrichment = {
      enrichQuest: jest.fn(),
    };
    service = new QuestsService(prisma, notifications, questEnrichment);
  });

  function primeBaseJoinMocks(overrides: Record<string, any> = {}) {
    prisma.questTemplate.findUnique.mockResolvedValue({
      id: 'quest-1',
      title: 'Quest',
      creatorId: 'creator-1',
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      durationMinutes: 60,
      locationId: 'loc-1',
      maxParticipants: 4,
      cost: 'free',
      costAmountCents: 0,
      currency: 'KES',
      ...overrides.template,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      alias: 'joiner',
      name: 'Joiner',
      email: 'joiner@example.com',
      ...overrides.user,
    });
    prisma.questInstance.findFirst.mockResolvedValue({
      id: 'instance-1',
      participants: [],
      ...overrides.instance,
    });
    prisma.questParticipant.findUnique.mockResolvedValue(overrides.existingParticipant ?? null);
  }

  it('throws a conflict error when the user already joined', async () => {
    primeBaseJoinMocks({
      existingParticipant: { instanceId: 'instance-1', userId: 'user-1' },
    });

    await expect(service.join('quest-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws a payment error for a paid quest without a valid payment path', async () => {
    primeBaseJoinMocks({
      template: {
        cost: 'paid',
        costAmountCents: 2500,
      },
    });

    await expect(service.join('quest-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.join('quest-1', 'user-1')).rejects.toThrow('Payment method is required');
  });

  it('throws a capacity error when the quest is full', async () => {
    primeBaseJoinMocks({
      instance: {
        participants: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }],
      },
    });

    await expect(service.join('quest-1', 'user-1', { paymentMethod: 'card' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.join('quest-1', 'user-1', { paymentMethod: 'card' })).rejects.toThrow('Quest is full');
  });

  it('throws an error when the creator tries to join their own quest', async () => {
    primeBaseJoinMocks({
      template: {
        creatorId: 'user-1',
      },
    });

    await expect(service.join('quest-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.join('quest-1', 'user-1')).rejects.toThrow('Quest creators cannot join their own quest');
  });
});
