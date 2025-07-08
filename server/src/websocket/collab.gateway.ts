import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { CollabService } from './collab.service';
import * as Y from 'yjs';
import { ClientInfo } from './interfaces/client.interface';
import { encoding } from 'lib0';

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
  // Store documents per room
  private rooms = new Map<string, Y.Doc>();
  // Store client connections
  private clients = new Map<string, ClientInfo>();
  // Store awareness states
  private awarenessStates = new Map<string, Map<number, any>>();

  constructor(private readonly collabService: CollabService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      // Clean up awareness state
      const awarenessMap = this.awarenessStates.get(clientInfo.sessionId);
      if (awarenessMap) {
        awarenessMap.delete(client.id.hashCode());
        this.broadcastAwarenessUpdate(clientInfo.sessionId, client.id);
      }

      this.clients.delete(client.id);
    }
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    client: Socket,
    payload: { username: string; sessionId: string },
  ) {
    // Get or create document for this room
    let doc = this.rooms.get(payload.sessionId);
    if (!doc) {
      doc = new Y.Doc();
      this.rooms.set(payload.sessionId, doc);

      // Set up document update handler
      doc.on('update', (update: Uint8Array, origin: any) => {
        if (origin !== client.id) {
          this.broadcastUpdate(payload.sessionId, update, client.id);
        }
      });
    }

    // Store client info
    this.clients.set(client.id, {
      socket: client,
      doc,
      sessionId: payload.sessionId,
    });

    // Initialize awareness for this room if needed
    if (!this.awarenessStates.has(payload.sessionId)) {
      this.awarenessStates.set(payload.sessionId, new Map());
    }

    // Join the room
    client.join(payload.sessionId);

    // Send current document state to the new client
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // Sync step 1
    Y.writeSyncStep1(encoder, doc);
    Y.encodeStateAsUpdate(encoder, doc);
    const syncMessage = encoding.toUint8Array(encoder);

    client.emit('yjs-message', {
      type: 'sync',
      data: Array.from(syncMessage), // Convert to array for JSON serialization
    });

    console.log(`Client ${client.id} joined room ${payload.sessionId}`);
  }

  private broadcastUpdate(
    sessionId: string,
    update: Uint8Array,
    originClientId: string,
  ) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 2); // Update message type
    encoding.writeVarUint8Array(encoder, update);
    const message = encoding.toUint8Array(encoder);

    this.server
      .to(sessionId)
      .except(originClientId)
      .emit('yjs-message', {
        type: 'sync',
        data: Array.from(message),
      });
  }

  private broadcastAwarenessUpdate(sessionId: string, originClientId: string) {
    const awarenessMap = this.awarenessStates.get(sessionId);
    if (!awarenessMap) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 3); // Awareness message type
    encoding.writeVarUint(encoder, awarenessMap.size);

    awarenessMap.forEach((state, clientId) => {
      encoding.writeVarUint(encoder, clientId);
      encoding.writeVarUint(encoder, 0); // Clock
      encoding.writeVarString(encoder, JSON.stringify(state));
    });

    const message = encoding.toUint8Array(encoder);

    this.server
      .to(sessionId)
      .except(originClientId)
      .emit('yjs-message', {
        type: 'awareness',
        data: Array.from(message),
      });
  }
}
