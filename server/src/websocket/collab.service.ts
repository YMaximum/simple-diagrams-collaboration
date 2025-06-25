import { Injectable } from '@nestjs/common';
import { initialEdges } from 'src/data/edges';
import { initialNodes } from 'src/data/nodes';
import { Edge, Node } from './interfaces/diagram.interface';
import data from '../data/data.json';

@Injectable()
export class CollabService {
  private diagram = new Map<string, { nodes: Node[]; edges: Edge[] }>();

  getDiagram(sessionId: string): { nodes: Node[]; edges: Edge[] } {
    console.log(data);
    if (!this.diagram.has(sessionId)) {
      this.diagram.set(sessionId, { nodes: data.nodes, edges: data.edges });
    }

    return { nodes: data.nodes, edges: data.edges };
  }
}
