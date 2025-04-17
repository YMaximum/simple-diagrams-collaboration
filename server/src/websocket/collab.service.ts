import { Injectable } from '@nestjs/common';
import { initialEdges } from 'src/data/edges';
import { initialNodes } from 'src/data/nodes';
import { Edge, Node } from './interfaces/diagram.interface';

@Injectable()
export class CollabService {
  private diagram = new Map<string, { nodes: Node[]; edges: Edge[] }>();

  getDiagram(sessionId: string): { nodes: Node[]; edges: Edge[] } {
    if (!this.diagram.has(sessionId)) {
      this.diagram.set(sessionId, { nodes: initialNodes, edges: initialEdges });
    }

    return { nodes: initialNodes, edges: initialEdges };
  }
}
