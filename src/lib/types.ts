
// src/lib/types.ts
import { Edge, Node } from '@xyflow/react';

export type NodeType = "person" | "place" | "event" | "concept" | "cause" | "political" | "economic" | "social" | "cultural" | "term" | "date" | "goal" | "indicator" | "country" | "other";

export const EdgeTypes = {
  CAUSES: 'causes',
  INFLUENCES: 'influences',
  PARTICIPATES: 'participates',
  LOCATED: 'located',
} as const;

export type EdgeType = typeof EdgeTypes[keyof typeof EdgeTypes];

export interface Position {
  x: number;
  y: number;
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  description?: string;
  position: Position;
  context?: string;
  imageUrl?: string;
  subtitle?: string;
}

export interface EdgeData extends Record<string, unknown> {
  label: string;
  type: EdgeType;
}

export interface Entity {
  id: string;
  type: NodeType;
  text: string;
  startIndex: number;
  endIndex: number;
  context?: string;
}

export type CustomNode = Node<NodeData>;
export type CustomEdge = Edge<EdgeData>;
