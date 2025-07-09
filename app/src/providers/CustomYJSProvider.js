import * as Y from "yjs";
import { io, Socket } from "socket.io-client";
import { encoding, decoding } from "lib0";
import { SyncType } from "@/constants/syncType";

export class CustomYjsProvider {
  socket;
  doc;
  roomId;
  connected = false;

  constructor(wsUrl, roomId, doc) {
    this.doc = doc;
    this.roomId = roomId;

    // Initialize Socket.IO connection
    this.socket = io(wsUrl, {
      transports: ["websocket"],
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle connection
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket");
      this.connected = true;

      // Join the room
      this.socket.emit("join-room", { roomId: this.roomId });
      this.socket.on("initial-load", (payload) => {
        this.handleDocMessage(payload.type, payload.data);
      });
    });

    // Handle disconnect
    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
      this.connected = false;
    });

    // Handle doc messages
    this.socket.on("doc-message", (payload) => {
      this.handleDocMessage(payload.type, new Uint8Array(payload.data));
    });

    // Handle document updates
    this.doc.on("update", (update, origin) => {
      if (origin !== this && this.connected) {
        this.sendMessage(SyncType.Update, update);
      }
    });
  }

  handleDocMessage(messageType, messageData) {
    try {
      switch (messageType) {
        case SyncType.Request:
          // Server is requesting our state
          this.sendMessage(SyncType.Receive, Y.encodeStateAsUpdate(this.doc));
          break;

        case SyncType.Update:
          // Server is sending an incremental update
          Y.applyUpdate(this.doc, messageData, this);
          break;
      }
    } catch (error) {
      console.error("Error handling Y.js message:", error);
    }
  }

  sendMessage(type, data) {
    if (this.connected) {
      this.socket.emit("doc-message", {
        type,
        data: Array.from(data),
      });
    }
  }

  // Clean up
  destroy() {
    this.socket.disconnect();
  }
}

// Usage example - replace your WebsocketProvider with this:
export function setupCollaboration(roomId) {
  const doc = new Y.Doc();

  // Create custom provider instead of WebsocketProvider
  const provider = new CustomYjsProvider(
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3000",
    roomId,
    doc
  );

  return { doc, nodes, edges, provider };
}
