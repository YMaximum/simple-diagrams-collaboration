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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

  private updateSessionUserList(sessionId: string) {
    const sessionUsers = Array.from(this.users.values())
      .filter((user) => user.sessionId === sessionId)
      .map((user) => user.username);

    this.server.to(sessionId).emit('user-list', sessionUsers);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    if (this.users.has(client.id)) {
      const userSession = this.users.get(client.id);
      if (!userSession) {
        return;
      }
      this.users.delete(client.id);

      this.updateSessionUserList(userSession.sessionId);
    }
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    client: Socket,
    payload: { username: string; sessionId: string },
  ) {
    console.log(`User ${payload.username} joined session ${payload.sessionId}`);

    this.users.set(client.id, {
      username: payload.username,
      sessionId: payload.sessionId,
    });

    client.join(payload.sessionId);

    const currentMessages = this.sessionMessages.get(payload.sessionId) || [];
    client.emit('chat-messages', currentMessages);

    client.emit('session-joined');

    this.updateSessionUserList(payload.sessionId);
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    client: Socket,
    payload: { username: string; sessionId: string },
  ) {
    console.log(`User ${payload.username} left session ${payload.sessionId}`);

    if (this.users.has(client.id)) {
      const userSession = this.users.get(client.id);
      if (!userSession) {
        return;
      }
      this.users.delete(client.id);

      client.leave(payload.sessionId);
      client.emit('user-list', []);
      client.emit('chat-messages', []);

      this.updateSessionUserList(payload.sessionId);
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    client: Socket,
    payload: { username: string; message: string; sessionId: string },
  ) {
    const userSession = this.users.get(client.id);
    if (!userSession || userSession.sessionId !== payload.sessionId) {
      return;
    }

    const currentMessages = this.sessionMessages.get(payload.sessionId) || [];
    currentMessages.push({
      username: payload.username,
      message: payload.message,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    });
    this.sessionMessages.set(payload.sessionId, currentMessages);

    this.server.to(payload.sessionId).emit('chat-messages', currentMessages);
  }
}
