import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private async getHostUserId(instanceId: string) {
    const instance = await this.prisma.questInstance.findUnique({
      where: { id: instanceId },
      include: {
        template: {
          select: { creatorId: true },
        },
      },
    });

    return instance?.creatorId || instance?.template?.creatorId || null;
  }

  async listMessages(instanceId: string, userId: string) {
    const isParticipant = await this.prisma.questParticipant.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!isParticipant) throw new BadRequestException('Join the quest to view chat');

    const [messages, hostUserId] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { instanceId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.getHostUserId(instanceId),
    ]);

    return messages.map((message) => ({
      ...message,
      isHost: Boolean(hostUserId && message.userId === hostUserId),
    }));
  }

  async sendMessage(instanceId: string, userId: string, text: string) {
    if (!text?.trim()) throw new BadRequestException('Message required');
    const isParticipant = await this.prisma.questParticipant.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!isParticipant) throw new BadRequestException('Join the quest to chat');

    const [message, hostUserId] = await Promise.all([
      this.prisma.chatMessage.create({
        data: { instanceId, userId, text: text.trim() },
        include: { user: true },
      }),
      this.getHostUserId(instanceId),
    ]);

    return {
      ...message,
      isHost: Boolean(hostUserId && message.userId === hostUserId),
    };
  }

  async notifyParticipants(instanceId: string, senderId: string, text: string) {
    const [participants, sender] = await Promise.all([
      this.prisma.questParticipant.findMany({
        where: { instanceId },
        select: { userId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { alias: true, name: true, email: true },
      }),
    ]);
    const targets = participants.map((p) => p.userId).filter((id) => id !== senderId);
    if (!targets.length) return;

    const senderLabel =
      sender?.alias?.trim() ||
      sender?.name?.trim() ||
      sender?.email?.split('@')[0] ||
      'Someone';

    await this.prisma.notification.createMany({
      data: targets.map((userId) => ({
        userId,
        type: 'chat_message',
        title: `${senderLabel} sent a message`,
        body: text.trim().slice(0, 120),
        data: { instanceId },
      })),
    });
  }
}
