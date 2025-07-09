import { Injectable } from '@nestjs/common';
import { initialEdges } from 'src/data/edges';
import { initialNodes } from 'src/data/nodes';
import * as Y from 'yjs';

@Injectable()
export class CollabService {
  getInitialDoc(): Y.Doc {
    const doc = new Y.Doc();
    const nodes = doc.getMap('nodes');
    const edges = doc.getMap('edges');

    if (nodes.size === 0) {
      initialNodes.forEach((item) => nodes.set(item.id, item));
    }
    if (edges.size === 0) {
      initialEdges.forEach((item) => edges.set(item.id, item));
    }
    return doc;
  }
}
