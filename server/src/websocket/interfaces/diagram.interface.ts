export interface Handle {
  id: string;
  type: string;
  sidelocation: string;
  name: string;
  position: string;
}

export interface Node {
  id: string;
  data: {
    label: string;
    handles: Handle[];
    kind: string;
  };
  type: string;
  position: {
    x: number;
    y: number;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}
