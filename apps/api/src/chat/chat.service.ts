import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async listMessages(instanceId: string, userId: string) {
    const isParticipant = await this.prisma.questParticipant.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!isParticipant) throw new BadRequestException('Join the quest to view chat');

    return this.prisma.chatMessage.findMany({
      where: { instanceId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async sendMessage(instanceId: string, userId: string, text: string) {
    if (!text?.trim()) throw new BadRequestException('Message required');
    const isParticipant = await this.prisma.questParticipant.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!isParticipant) throw new BadRequestException('Join the quest to chat');

    return this.prisma.chatMessage.create({
      data: { instanceId, userId, text: text.trim() },
      include: { user: true },
    });
  }

  async notifyParticipants(instanceId: string, senderId: string, text: string) {
    const participants = await this.prisma.questParticipant.findMany({
      where: { instanceId },
      select: { userId: true },
    });
    const targets = participants.map((p) => p.userId).filter((id) => id !== senderId);
    if (!targets.length) return;
    await this.prisma.notification.createMany({
      data: targets.map((userId) => ({
        userId,
        type: 'chat_message',
        title: 'New chat message',
        body: text.slice(0, 120),
        data: { instanceId },
      })),
    });
  }
}
