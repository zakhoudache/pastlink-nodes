
import { Node } from '@xyflow/react';

export const getNodePosition = (nodes: Node[]): { x: number; y: number } => {
  if (nodes.length === 0) return { x: 100, y: 100 };

  const lastNode = nodes[nodes.length - 1];
  return {
    x: lastNode.position.x + 250,
    y: lastNode.position.y,
  };
};

export const getNodesBounds = (nodes: Node[]) => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 1000, height: 1000 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const nodeWidth = (node.width || 0) + 100;
    const nodeHeight = (node.height || 0) + 100;

    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};
