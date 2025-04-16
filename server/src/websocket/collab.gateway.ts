import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { Injectable } from '@nestjs/common';
import { CollabService } from './collab.service';

@WebSocketGateway({
  namespace: '/collab',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Injectable()
export class CollabGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly collabService: CollabService) {}

  @SubscribeMessage('join-session')
  handleJoinSession(
    client: Socket,
    payload: { username: string; sessionId: string },
  ) {
    const diagram = this.collabService.getDiagram(payload.sessionId);
    client.join(payload.sessionId);

    client.emit('diagram', diagram);
  }
}
