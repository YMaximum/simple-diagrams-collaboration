import { Injectable } from '@nestjs/common';
import { initialEdges } from 'src/data/edges';
import { initialNodes } from 'src/data/nodes';
import { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';

@Injectable()
export class CollabService {
  private docs = new Map<string, { doc: Y.Doc; awareness: Awareness }>();

  getDoc(sessionId: string): { doc: Y.Doc; awareness: Awareness } {
    if (!this.docs.has(sessionId)) {
      const doc = new Y.Doc();
      const awareness = new Awareness(doc);

      // Create shared data structures
      const nodes = doc.getArray('nodes');
      const edges = doc.getArray('edges');

      // Insert initial data
      nodes.push(initialNodes); // assuming initialNodes is an array of objects
      edges.push(initialEdges); // same for initialEdges

      this.docs.set(sessionId, { doc, awareness });
    }

    return this.docs.get(sessionId) as { doc: Y.Doc; awareness: Awareness };
  }
}
