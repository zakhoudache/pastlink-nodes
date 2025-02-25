
import React, { createContext, useCallback, useRef, useEffect,useContext ,useState, useMemo } from "react";

import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { Node, Edge, applyNodeChanges, NodeChange } from '@xyflow/react';
import { NodeData, EdgeData, NodeType, EdgeTypes, EdgeType, Entity } from "@/lib/types";

export { EdgeTypes };
export type { EdgeType, NodeData };

interface GraphContextProps {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  entities: Entity[];
  selectedNode: Node<NodeData> | null;
  selectedEdge: Edge<EdgeData> | null;
  containerDimensions: { width: number; height: number };
  defaultEdgeType: string;
  loading: boolean;
  error: string | null;
  setContainerDimensions: (dimensions: {
    width: number;
    height: number;
  }) => void;
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge<EdgeData>[]) => void;
  setEntities: (entities: Entity[]) => void;
  addNode: (node: Omit<NodeData, "position">) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<EdgeData, "id">) => void;
  updateEdge: (id: string, data: Partial<EdgeData>) => void;
  removeEdge: (id: string) => void;
  selectNode: (node: Node<NodeData> | null) => void;
  selectEdge: (edge: Edge<EdgeData> | null) => void;
  setDefaultEdgeType: (type: string) => void;
  analyzeText: (text: string) => Promise<Entity[]>;
  convertEntitiesToNodes: (entities: Entity[]) => void;
  onNodesChangeHandler: (changes: NodeChange[]) => void; // Add this
}

const GraphContext = createContext<GraphContextProps | undefined>(undefined);

// Get environment variables
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://uimmjzuqdqxfqoikcexf.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbW1qenVxZHF4ZnFvaWtjZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDA1NTcsImV4cCI6MjA1NTYxNjU1N30.gSdv5Q0seyNiWhjEwXCzKzxYN1TUTFGxOpKUZtF06J0";

export function GraphProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<EdgeData>[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<EdgeData> | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [defaultEdgeType, setDefaultEdgeType] = useState("influences");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () => createClient(supabaseUrl, supabaseAnonKey),
    [],
  );

  const arrangeNodes = useCallback((entities: Entity[]) => {
    // More sophisticated node arrangement logic
    const SPACING = 200;
    const COLS = Math.max(
      2,
      Math.min(4, Math.ceil(Math.sqrt(entities.length))),
    );

    // Group entities by type
    const groupedEntities: Record<string, Entity[]> = {};
    entities.forEach((entity) => {
      if (!groupedEntities[entity.type]) {
        groupedEntities[entity.type] = [];
      }
      groupedEntities[entity.type].push(entity);
    });

    // Calculate positions by group
    let currentRow = 0;
    let maxEntitiesInRow = 0;
    const positionedEntities: Node[] = [];

    Object.entries(groupedEntities).forEach(([type, typeEntities]) => {
      let col = 0;
      typeEntities.forEach((entity, index) => {
        // Create node with calculated position
        positionedEntities.push({
          id: entity.id,
          position: {
            x: col * SPACING + Math.random() * 30 - 15,
            y: currentRow * SPACING + Math.random() * 30 - 15,
          },
          data: {
            label: entity.text,
            type: entity.type,
            description: entity.context,
            position: {
              x: col * SPACING + Math.random() * 30 - 15,
              y: currentRow * SPACING + Math.random() * 30 - 15,
            },
            context: entity.context,
          },
        });

        col++;
        if (col >= COLS) {
          col = 0;
          currentRow++;
        }
        maxEntitiesInRow = Math.max(maxEntitiesInRow, col);
      });

      if (col > 0) {
        currentRow++;
      }
    });

    return positionedEntities;
  }, []);

  const convertEntitiesToNodes = useCallback(
    (entitiesToConvert: Entity[]) => {
      try {
        // Validate entities first
        if (
          !Array.isArray(entitiesToConvert) ||
          entitiesToConvert.length === 0
        ) {
          console.warn("No valid entities to convert");
          return;
        }

        // Filter out entities that already exist as nodes
        const existingNodeIds = new Set(nodes.map((node) => node.id));
        const newEntities = entitiesToConvert.filter(
          (entity) => entity.id && !existingNodeIds.has(entity.id),
        );

        if (newEntities.length === 0) {
          console.log("All entities already exist as nodes");
          return;
        }

        console.log(`Converting ${newEntities.length} new entities to nodes`);
        const newNodes = arrangeNodes(newEntities);

        setNodes((prevNodes) => [...prevNodes, ...newNodes]);

        // Trigger resize event to ensure proper rendering
        setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
      } catch (error) {
        console.error("Error in convertEntitiesToNodes:", error);
        setError("Failed to convert entities to nodes");
      }
    },
    [arrangeNodes, nodes],
  );

  const analyzeText = useCallback(
    async (text: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke(
          "analyze-text",
          {
            body: { text },
          },
        );

        if (functionError) {
          console.error("Supabase function error:", functionError);
          setError(functionError.message);
          throw functionError;
        }

        const { entities, relationships } = data;
        console.log("Extracted entities:", entities);
        console.log("Extracted relationships:", relationships);

        // Process entities
        const validatedEntities = entities.map((entity: Entity) => ({
          ...entity,
          id: entity.id || uuidv4(),
        }));

        // Convert entities to nodes
        const newNodes = arrangeNodes(validatedEntities);
        setNodes(prevNodes => [...prevNodes, ...newNodes]);

        // Process relationships into edges
        if (relationships && relationships.length > 0) {
          const newEdges = relationships.map((rel: any) => ({
            id: `e${uuidv4()}`,
            source: rel.source,
            target: rel.target,
            label: rel.description || rel.type,
            type: rel.type,
            data: {
              type: rel.type,
              description: rel.description,
            },
          }));
          setEdges(prevEdges => [...prevEdges, ...newEdges]);
        }

        setEntities(validatedEntities);
        return validatedEntities;
      } catch (error) {
        console.error("Analysis error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error during analysis";
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, arrangeNodes],
  );

  const addNode = useCallback(
    (node: Omit<NodeData, "position">) => {
      const newNode: Node<NodeData> = {
        id: uuidv4(),
        position: {
          x: containerDimensions.width / 2 + (Math.random() * 100 - 50),
          y: containerDimensions.height / 2 + (Math.random() * 100 - 50),
        },
        data: {
          ...node,
          position: {
            x: containerDimensions.width / 2 + (Math.random() * 100 - 50),
            y: containerDimensions.height / 2 + (Math.random() * 100 - 50),
          },
        },
      };
      setNodes((prev) => [...prev, newNode]);
    },
    [containerDimensions],
  );

  const updateNode = useCallback((id: string, data: Partial<NodeData>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    );
  }, []);

  const removeNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== id));
      setEdges((prev) =>
        prev.filter((edge) => edge.source !== id && edge.target !== id),
      );
      if (selectedNode?.id === id) {
        setSelectedNode(null);
      }
    },
    [selectedNode],
  );

  const addEdge = useCallback(
    (edge: Omit<EdgeData, "id">) => {
      // Validate source and target exist
      if (!edge.source || !edge.target) {
        console.warn("Invalid edge: missing source or target");
        return;
      }

      // Check if nodes exist
      const sourceExists = nodes.some((node) => node.id === edge.source);
      const targetExists = nodes.some((node) => node.id === edge.target);

      if (!sourceExists || !targetExists) {
        console.warn(
          `Cannot create edge: ${!sourceExists ? "source" : "target"} node doesn't exist`,
        );
        return;
      }

      const newEdge: Edge<EdgeData> = {
        id: `e${uuidv4()}`,
        ...edge,
        type: edge.type || defaultEdgeType,
      };
      setEdges((prev) => [...prev, newEdge]);
    },
    [defaultEdgeType, nodes],
  );

  const updateEdge = useCallback((id: string, data: Partial<EdgeData>) => {
    setEdges((prev) =>
      prev.map((edge) => (edge.id === id ? { ...edge, ...data } : edge)),
    );
  }, []);

  const removeEdge = useCallback(
    (id: string) => {
      setEdges((prev) => prev.filter((edge) => edge.id !== id));
      if (selectedEdge?.id === id) {
        setSelectedEdge(null);
      }
    },
    [selectedEdge],
  );

  const selectNode = useCallback((node: Node<NodeData> | null) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const selectEdge = useCallback((edge: Edge<EdgeData> | null) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onNodesChangeHandler = useCallback(
    (changes: NodeChange[]) => {
      setNodes((prevNodes) => {
        const updatedNodes = applyNodeChanges(changes, prevNodes);
        return updatedNodes;
      });
    },
    []
  );

  useEffect(() => {
    const handleResize = () => {
      if (nodes.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 100);
      }
    };
    handleResize();
  }, [nodes]);

  return (
    <GraphContext.Provider
      value={{
        nodes,
        edges,
        entities,
        selectedNode,
        selectedEdge,
        containerDimensions,
        defaultEdgeType,
        loading,
        error,
        setContainerDimensions,
        setNodes,
        setEdges,
        setEntities,
        addNode,
        updateNode,
        removeNode,
        addEdge,
        updateEdge,
        removeEdge,
        selectNode,
        selectEdge,
        setDefaultEdgeType,
        analyzeText,
        convertEntitiesToNodes,
        onNodesChangeHandler // Add this
      }}
    >
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraph must be used within a GraphProvider");
  }
  return context;
}
