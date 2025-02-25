import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  ReactFlowInstance,
} from '@xyflow/react';
import "reactflow/dist/style.css";
import BaseNode from "./nodes/BaseNode";
import { useGraph, EdgeType } from "@/context/GraphContext";
import { debounce } from "lodash";

const nodeTypes = {
  custom: BaseNode,
};

const getEdgeStyle = (type: EdgeType) => {
  const styles = {
    [EdgeType.CAUSES]: { stroke: "#ef4444", strokeWidth: 2 },
    [EdgeType.INFLUENCES]: { stroke: "#a855f7", strokeWidth: 2 },
    [EdgeType.PARTICIPATES]: { stroke: "#3b82f6", strokeWidth: 2 },
    [EdgeType.LOCATED]: { stroke: "#22c55e", strokeWidth: 2 },
  };
  return styles[type] || { stroke: "#64748b", strokeWidth: 2 };
};

const useResizeObserver = (ref: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    };

    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(ref.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [ref]);

  return dimensions;
};

function hasType(data: any): data is { type: string } {
  return typeof data === "object" && data !== null && "type" in data;
}

const GraphDisplay = () => {
  const {
    nodes,
    edges,
    selectNode,
    selectEdge,
    addEdge: addNewEdge,
    setContainerDimensions,
    containerDimensions,
    defaultEdgeType,
  } = useGraph();

  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const dimensions = useResizeObserver(containerRef);

  const debouncedFitView = useCallback(
    debounce(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView();
      }
    }, 200),
    [],
  );

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      if (
        !containerDimensions ||
        dimensions.width !== containerDimensions.width ||
        dimensions.height !== containerDimensions.height
      ) {
        setContainerDimensions({
          width: dimensions.width,
          height: dimensions.height,
        });
        debouncedFitView();
      }
    }
  }, [
    dimensions,
    setContainerDimensions,
    containerDimensions,
    debouncedFitView,
  ]);

  // Map context nodes/edges to ReactFlow format
  const flowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: "custom",
    position: node.position,
    data: node.data, // Ensure this is node.data, not node
  }));

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true,
    style: getEdgeStyle(edge.type as EdgeType),
    data: { type: edge.type },
  }));

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node); // Pass the full node object
    },
    [selectNode],
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: (edge.label || "") as string,
        type: (edge.data?.type as EdgeType) || defaultEdgeType,
      });
    },
    [selectEdge, defaultEdgeType],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      addNewEdge({
        source: params.source!,
        target: params.target!,
        label: "New Connection",
        type: EdgeType.INFLUENCES,
      });
    },
    [addNewEdge],
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    instance.fitView();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-background border-x">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onInit={onInit}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (hasType(node.data)) {
              const colors = {
                person: "#3b82f6",
                event: "#ef4444",
                place: "#22c55e",
                concept: "#a855f7",
              };
              return colors[node.data.type] || "#64748b";
            }
            return "#64748b";
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;
