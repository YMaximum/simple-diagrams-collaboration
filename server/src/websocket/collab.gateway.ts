import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { Injectable } from '@nestjs/common';
import { CollabService } from './collab.service';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';

@WebSocketGateway({
  namespace: '/collab',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Injectable()
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly collabService: CollabService) {}

  private clientToSessionMap = new Map<string, string>();
  private socketToAwarenessId = new Map<string, number>();
  private nextAwarenessId = 1;

  @SubscribeMessage('join-session')
  handleJoinSession(
    client: Socket,
    payload: { username: string; sessionId: string },
  ) {
    const { doc, awareness } = this.collabService.getDoc(payload.sessionId);

    client.join(payload.sessionId);
    this.clientToSessionMap.set(client.id, payload.sessionId);

    // Assign a numeric awareness client ID
    const awarenessClientId = this.nextAwarenessId++;
    this.socketToAwarenessId.set(client.id, awarenessClientId);

    // Send full document state to the new client
    const stateUpdate = Y.encodeStateAsUpdate(doc);
    client.emit('sync', stateUpdate);

    // Send current awareness state to the new client
    const currentStates = Array.from(awareness.getStates().keys());
    const awarenessUpdate = encodeAwarenessUpdate(awareness, currentStates);
    client.emit('awareness-update', awarenessUpdate);

    console.log(
      `Client ${client.id} joined session ${payload.sessionId} as awarenessId ${awarenessClientId}`,
    );
  }

  @SubscribeMessage('sync')
  handleSync(
    client: Socket,
    payload: { update: Uint8Array; sessionId: string },
  ) {
    const { doc } = this.collabService.getDoc(payload.sessionId);
    Y.applyUpdate(doc, payload.update);

    // Broadcast update to other clients in the session
    client.to(payload.sessionId).emit('sync', payload.update);
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    client: Socket,
    payload: { sessionId: string; update: Uint8Array },
  ) {
    const { awareness } = this.collabService.getDoc(payload.sessionId);

    const awarenessClientId = this.socketToAwarenessId.get(client.id);
    if (awarenessClientId === undefined) {
      console.warn(`Missing awarenessClientId for client ${client.id}`);
      return;
    }

    applyAwarenessUpdate(awareness, payload.update, awarenessClientId);

    // Emit to other clients in the room
    client.to(payload.sessionId).emit('awareness-update', payload.update);
  }

  handleDisconnect(client: Socket) {
    const sessionId = this.clientToSessionMap.get(client.id);
    if (!sessionId) return;

    const awarenessClientId = this.socketToAwarenessId.get(client.id);
    if (awarenessClientId === undefined) return;

    const { awareness } = this.collabService.getDoc(sessionId);

    // Remove client state and broadcast update
    removeAwarenessStates(awareness, [awarenessClientId], null);
    const update = encodeAwarenessUpdate(awareness, [awarenessClientId]);
    client.to(sessionId).emit('awareness-update', update);

    // Cleanup maps
    this.clientToSessionMap.delete(client.id);
    this.socketToAwarenessId.delete(client.id);

    console.log(
      `Client ${client.id} (awarenessId: ${awarenessClientId}) disconnected from session ${sessionId}`,
    );
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }
}
