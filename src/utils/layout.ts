import Elk from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';

export async function elkLayout(nodes: Node[], edges: Edge[]) {
  const elk = new Elk({
    defaultLayoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': 100,
      'elk.layered.spacing.nodeNodeBetweenLayers': 150,
    },
  });

  const graph = await elk.layout({
    id: 'root',
    children: nodes.map(node => ({
      id: node.id,
      width: 240,
      height: node.data.type === 'event' ? 160 : 120,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });

  return nodes.map(node => {
    const elkNode = graph.children?.find(n => n.id === node.id);
    return {
      ...node,
      position: { x: elkNode?.x || 0, y: elkNode?.y || 0 },
    };
  });
}