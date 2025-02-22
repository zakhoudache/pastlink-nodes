// src/utils/flowUtils.ts
import { Node, Rect, Position } from '@xyflow/react';

export const getNodePosition = (nodes: Node[]): { x: number; y: number } => {
  if (nodes.length === 0) {
    return { x: 50, y: 50 };  // Default position for the first node
  }

  const maxX = Math.max(...nodes.map(node => node.position.x + (node.width ?? 100))); // Consider node width
  const maxY = Math.max(...nodes.map(node => node.position.y));

  return { x: maxX + 100, y: maxY }; // Position the new node to the right of the existing nodes
};

export const getNodesBounds = (nodes: Node[]): Rect => {
    if (nodes.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const nodeWidth = node.width ?? 172;  // HistoricalNode default width.
      const nodeHeight = node.height ?? 108; // HistoricalNode default height
      const x = node.position.x;
      const y = node.position.y;


        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + nodeWidth);
        maxY = Math.max(maxY, y + nodeHeight);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
};