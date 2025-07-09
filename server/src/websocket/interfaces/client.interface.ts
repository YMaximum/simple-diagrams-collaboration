import * as Y from 'yjs';
import { Socket } from 'socket.io';

export interface ClientInfo {
  socket: Socket;
  doc: Y.Doc;
  roomId: string;
}
