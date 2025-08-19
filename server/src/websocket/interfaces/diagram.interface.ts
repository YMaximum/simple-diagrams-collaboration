export interface Ports {
  idpfport: number;
  name: string;
  sidelocation: number;
  hasDirection: 'inlet' | 'outlet' | 'unknown';
  position: number;
}

export interface Node {
  id: string;
  data: {
    label: string;
    image: string;
    ports: Ports[];
  };
  type: string;
  height: number;
  width: number;
  selected: boolean;
  sourcePosition: 'right' | 'left';
  targetPosition: 'right' | 'left';
  position: {
    x: number;
    y: number;
  };
}

export interface Edge {
  id: string;
  type: string;
  animated: boolean;
  style: {
    strokeWidth: number;
    stroke: string;
  };
  markerEnd: {
    type: string;
    color: string;
    width: number;
    height: number;
  };
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}
