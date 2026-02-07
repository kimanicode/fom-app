import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
export class ChatGateway {
  @WebSocketServer() server!: Server;

  constructor(private chat: ChatService, private jwt: JwtService) {}

  private getUserId(socket: Socket) {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const payload: any = this.jwt.verify(token);
      return payload?.sub as string;
    } catch {
      return null;
    }
  }

  @SubscribeMessage('join')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { instanceId: string }
  ) {
    const userId = this.getUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'unauthorized' });
      return;
    }
    await socket.join(`instance:${data.instanceId}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { instanceId: string; text: string }
  ) {
    const userId = this.getUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'unauthorized' });
      return;
    }
    const msg = await this.chat.sendMessage(data.instanceId, userId, data.text);
    this.server.to(`instance:${data.instanceId}`).emit('message', msg);
    await this.chat.notifyParticipants(data.instanceId, userId, msg.text);
  }
}
