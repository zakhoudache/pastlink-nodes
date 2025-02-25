import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  ReactFlowInstance,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

import { initialNodes, initialEdges } from "./initial-elements";
import { Position } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import { NodeData } from "@/lib/types";
import { HistoricalNode } from "../HistoricalNode";
import { layoutNodes } from "@/lib/graphLayout";
import { NodeType, EdgeType } from "@/lib/types";
import { HistoricalNodeData } from "@/lib/types";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB",
) => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    // We are shifting the dagre node position (defined center ) to the top left
    // so it matches the React Flow node anchor point
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const nodeTypes = {
  historicalNode: HistoricalNode,
};

const LayoutFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange, onConnect] = useEdgesState(
    initialEdges,
  );
  const [RFInstance, setRFInstance] = useState<ReactFlowInstance | null>(null);

  const onLayout = useCallback(
    (direction: string) => {
      const layouted = getLayoutedElements(
        nodes,
        edges,
        direction,
      );

      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    },
    [nodes, edges, setNodes, setEdges],
  );

  const onSave = useCallback(() => {
    if (RFInstance) {
      const flow = RFInstance.toObject();
      const str = JSON.stringify(flow);
      const blob = new Blob([str]);
      saveAs(blob, "flow.json");
    }
  }, [RFInstance]);

  const onLoad = useCallback(() => {
    const fr = new FileReader();
    fr.onload = (e: any) => {
      const flow = JSON.parse(e.target.result);

      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    };

    const el = document.createElement("input");
    el.type = "file";
    el.accept = ".json";

    el.addEventListener("change", (e: any) => {
      if (e.target?.files) {
        fr.readAsText(e.target.files[0]);
      }
    });

    el.click();
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        onLoad={setRFInstance}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 4,
          display: "flex",
        }}
      >
        <Button onClick={() => onLayout("TB")} variant={"outline"}>
          vertical layout
        </Button>
        <Button onClick={() => onLayout("LR")} variant={"outline"}>
          horizontal layout
        </Button>
        <Button onClick={onSave} variant={"outline"}>
          save flow
        </Button>
        <Button onClick={onLoad} variant={"outline"}>
          load flow
        </Button>
      </div>
    </div>
  );
};

export default LayoutFlow;
