// src/components/flow/AutoLayoutCanvas.tsx
import React, { useMemo } from 'react';
import dagre from ' ';
import HistoricalNode, { HistoricalNodeData } from '../HistoricalNode';

export interface NodeData {
  id: string;
  data: HistoricalNodeData;
  // Optionally include width/height if available
  width?: number;
  height?: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface AutoLayoutProps {
  nodes: NodeData[];
  edges: EdgeData[];
}

export default function AutoLayoutCanvas({ nodes, edges }: AutoLayoutProps) {
  // Use Dagre to compute layout positions for nodes.
  const layoutNodes = useMemo(() => {
    // Create a new directed graph
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));

    // Set graph options.
    // "rankdir" can be "TB" (top-to-bottom), "LR" (left-to-right), etc.
    g.setGraph({ rankdir: 'TB', marginx: 20, marginy: 20 });

    // Set nodes with dimensions (if not provided, default to 160x200).
    nodes.forEach((node) => {
      const width = node.width || 160;
      const height = node.height || 200;
      g.setNode(node.id, { width, height });
    });

    // Set edges to connect nodes.
    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    // Run the layout algorithm.
    dagre.layout(g);

    // Extract the computed positions.
    return nodes.map((node) => {
      const nodeWithPos = g.node(node.id);
      // Dagre returns the center position so we adjust to get top-left for absolute positioning.
      return {
        ...node,
        position: {
          x: nodeWithPos.x - (nodeWithPos.width / 2),
          y: nodeWithPos.y - (nodeWithPos.height / 2),
        },
      };
    });
  }, [nodes, edges]);

  return (
    <div className="relative w-full h-full">
      {layoutNodes.map((node) => (
        <div
          key={node.id}
          style={{ position: 'absolute', left: node.position.x, top: node.position.y }}
        >
          <HistoricalNode
            data={node.data}
            id={node.id}
            selected={false}
            isConnectable={true}
          />
        </div>
      ))}
    </div>
  );
}
