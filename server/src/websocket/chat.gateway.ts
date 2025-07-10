import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserSession } from './interfaces/user-session.interface';
import { UserMessage } from './interfaces/user-message.iterface';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users: Map<string, UserSession> = new Map();

  private sessionMessages: Map<string, UserMessage[]> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  private updateSessionUserList(roomId: string) {
    const sessionUsers = Array.from(this.users.values())
      .filter((user) => user.roomId === roomId)
      .map((user) => user.username);

    this.server.to(roomId).emit('user-list', sessionUsers);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    if (this.users.has(client.id)) {
      const userSession = this.users.get(client.id);
      if (!userSession) {
        return;
      }
      this.users.delete(client.id);

      this.updateSessionUserList(userSession.roomId);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinSession(
    client: Socket,
    payload: { username: string; roomId: string },
  ) {
    console.log(`User ${payload.username} joined session ${payload.roomId}`);

    this.users.set(client.id, {
      username: payload.username,
      roomId: payload.roomId,
    });

    await client.join(payload.roomId);

    const currentMessages = this.sessionMessages.get(payload.roomId) || [];
    client.emit('chat-messages', currentMessages);

    client.emit('session-joined');

    this.updateSessionUserList(payload.roomId);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveSession(
    client: Socket,
    payload: { username: string; roomId: string },
  ) {
    console.log(`User ${payload.username} left session ${payload.roomId}`);

    if (this.users.has(client.id)) {
      const userSession = this.users.get(client.id);
      if (!userSession) {
        return;
      }
      this.users.delete(client.id);

      await client.leave(payload.roomId);
      client.emit('user-list', []);
      client.emit('chat-messages', []);

      this.updateSessionUserList(payload.roomId);
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    client: Socket,
    payload: { username: string; message: string; roomId: string },
  ) {
    const userSession = this.users.get(client.id);
    if (!userSession || userSession.roomId !== payload.roomId) {
      return;
    }

    const currentMessages = this.sessionMessages.get(payload.roomId) || [];
    currentMessages.push({
      username: payload.username,
      message: payload.message,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    });
    this.sessionMessages.set(payload.roomId, currentMessages);

    this.server.to(payload.roomId).emit('chat-messages', currentMessages);
  }
}
