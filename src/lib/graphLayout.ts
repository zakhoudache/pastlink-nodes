import { NodeData } from "./types";

export const layoutNodes = (nodes: NodeData[]) => {
  return nodes.map((node) => ({
    ...node,
    position: node.position || { x: 0, y: 0 },
  }));
};
