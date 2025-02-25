// src/lib/graphLayout.ts
import { NodeData } from "./types";

// Force-directed layout algorithm (simplified)
export function arrangeNodes(nodes: NodeData[], width: number, height: number) {
  const positionedNodes = [...nodes];

  // Set initial positions if not already set
  positionedNodes.forEach((node) => {
    if (!node.position) {
      node.position = {
        x: Math.random() * (width - 200) + 100,
        y: Math.random() * (height - 200) + 100,
      };
    }
  });

  return positionedNodes;
}

// Helper function to generate a random position for a new node
export function generateRandomPosition(width: number, height: number) {
  return {
    x: Math.random() * (width - 200) + 100,
    y: Math.random() * (height - 200) + 100,
  };
}

// Utility to extract entities from text using basic regex (in real app, use NLP)
export function extractEntitiesFromText(text: string) {
  // Very simplified entity detection - in a real app you'd use a proper NLP library
  const entities = [];
  const personRegex = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
  const placeRegex = /(Mount [A-Z][a-z]+|[A-Z][a-z]+ City|[A-Z][a-z]+ Island)/g;
  const eventRegex =
    /([A-Z][a-z]+ Revolution|Battle of [A-Z][a-z]+|[A-Z][a-z]+ War)/g;

  let match;

  // Extract people
  while ((match = personRegex.exec(text)) !== null) {
    entities.push({
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "person",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Extract places
  while ((match = placeRegex.exec(text)) !== null) {
    entities.push({
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "place",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Extract events
  while ((match = eventRegex.exec(text)) !== null) {
    entities.push({
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "event",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return entities;
}
