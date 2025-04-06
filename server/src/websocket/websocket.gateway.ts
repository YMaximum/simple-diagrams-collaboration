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
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
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
    const { username, sessionId } = payload;
    console.log(`User ${username} joined session ${sessionId}`);

    this.users.set(client.id, { username, sessionId });

    client.join(sessionId);

    const currentMessages = this.sessionMessages.get(sessionId) || [];
    client.emit('chat-messages', currentMessages);

    client.emit('session-joined');

    this.updateSessionUserList(sessionId);
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    client: Socket,
    payload: { username: string; sessionId: string },
  ) {
    const { username, sessionId } = payload;
    console.log(`User ${username} left session ${sessionId}`);

    if (this.users.has(client.id)) {
      const userSession = this.users.get(client.id);
      if (!userSession) {
        return;
      }
      this.users.delete(client.id);

      client.leave(sessionId);
      client.emit('user-list', []);
      client.emit('chat-messages', []);

      this.updateSessionUserList(sessionId);
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    client: Socket,
    payload: { username: string; message: string; sessionId: string },
  ) {
    const { username, message, sessionId } = payload;

    const userSession = this.users.get(client.id);
    if (!userSession || userSession.sessionId !== sessionId) {
      return;
    }

    const currentMessages = this.sessionMessages.get(sessionId) || [];
    currentMessages.push({
      username,
      message,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    });
    this.sessionMessages.set(sessionId, currentMessages);

    this.server.to(sessionId).emit('chat-messages', currentMessages);
  }
}
