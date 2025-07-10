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
import { SyncType } from './constants/sync-type';
import { UserSession } from './interfaces/user-session.interface';
import { DocPayload } from './interfaces/doc.interface';

@WebSocketGateway({
  namespace: '/collab',
  cors: {
    origin: '*',
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

  constructor(private readonly collabService: CollabService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      this.clients.delete(client.id);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinSession(client: Socket, payload: UserSession) {
    // Get or create document for this room
    let doc = this.rooms.get(payload.roomId);
    if (!doc) {
      doc = this.collabService.getInitialDoc();
      this.rooms.set(payload.roomId, doc);

      // Set up document update handler
      doc.on('update', (update: Uint8Array, origin: any) => {
        if (origin) {
          this.broadcastUpdate(payload.roomId, update, client.id);
        }
      });
    }

    // Store client info
    this.clients.set(client.id, {
      socket: client,
      doc,
      roomId: payload.roomId,
    });

    // Join the room
    await client.join(payload.roomId);

    const syncMessage = Y.encodeStateAsUpdate(doc);

    client.emit('initial-load', {
      type: SyncType.Update,
      data: Array.from(syncMessage),
    });

    console.log(`Client ${client.id} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('doc-message')
  handleDocMessage(client: Socket, payload: DocPayload) {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) return;

    const messageData = new Uint8Array(payload.data);

    try {
      switch (payload.type) {
        case SyncType.Request:
          // Client is requesting current state
          client.emit('doc-message', {
            type: SyncType.Receive,
            data: Array.from(Y.encodeStateAsUpdate(clientInfo.doc)),
          });
          break;

        case SyncType.Update:
          // Client is sending an incremental update
          Y.applyUpdate(clientInfo.doc, messageData, client.id);
          break;
      }
    } catch (error) {
      console.error('Error processing Y.js message:', error);
    }
  }

  private broadcastUpdate(
    roomId: string,
    update: Uint8Array,
    originClientId: string,
  ) {
    this.server
      .to(roomId)
      .except(originClientId)
      .emit('doc-message', {
        type: SyncType.Update,
        data: Array.from(update),
      });
  }
}
