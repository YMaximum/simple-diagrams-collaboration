export function stringToColor(str) {
  let colour = "#";
  let hash = 0;

  for (const char of str) {
    hash = char.charCodeAt(0) + (hash << 5) - hash;
  }

  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).substring(-2);
  }

  return colour.substring(0, 7);
}

export const transformData = (nodes, edges) => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.data.label,
      kind: node.data.kind,
      handles: node.data.handles,
      fx: node.position.x / 10,
      fy: node.position.y / 10,
    })),
    links: validEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
  };
};