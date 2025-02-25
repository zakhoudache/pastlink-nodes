
// src/lib/types.ts
export type NodeType = "person" | "place" | "event" | "concept" | "cause" | "political" | "economic" | "social" | "cultural" | "term" | "date" | "goal" | "indicator" | "country" | "other";
export type EdgeType = "causes" | "influences" | "participates" | "located";

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  subtitle?: string;
  imageUrl?: string;
  description?: string;
  position?: { x: number; y: number };
  context?: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
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

export interface HistoricalNodeData extends NodeData {
  type: NodeType;
  label: string;
  description?: string;
}

