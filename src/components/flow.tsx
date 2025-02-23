'use client';

import { useCallback, useState, useEffect } from 'react';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  ReactFlowProvider,
  EdgeTypes,
  MarkerType,
  Background,
  Controls,
  Edge,
  Node,
  NodeChange,
  Connection,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  getViewportForBounds,
  useReactFlow,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import HistoricalNode, { NodeType, HistoricalNodeData } from './HistoricalNode';
import { HistoricalEdge, HistoricalEdgeData } from './HistoricalEdge';
import { EdgeDialog } from './EdgeDialog';
import { getNodePosition, getNodesBounds } from '../utils/flowUtils';
import { LeftPanel } from './flow/LeftPanel';
import { RightPanel, Highlight } from './flow/RightPanel';
import dagre from 'dagre';

const edgeTypes: EdgeTypes = {
  historical: HistoricalEdge,
};

const defaultEdgeOptions = {
  type: 'historical' as const,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
  },
};

const nodeTypes = {
  historical: HistoricalNode,
};

interface FlowProps {
  initialNodes: Node<HistoricalNodeData>[];
  initialEdges: Edge<HistoricalEdgeData>[];
}

const FlowContent: React.FC<FlowProps> = ({ initialNodes, initialEdges }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>(initialEdges);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);
  const [useAutoLayout, setUseAutoLayout] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const { setViewport } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleNodeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; data: HistoricalNodeData }>;
      const { id, data } = customEvent.detail;
      setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, data } : node))
      );
      window.dispatchEvent(
        new CustomEvent('nodesChange', {
          detail: nodes.map((node) => (node.id === id ? { ...node, data } : node)),
        })
      );
    };

    window.addEventListener('updateNodeData', handleNodeUpdate);
    return () => window.removeEventListener('updateNodeData', handleNodeUpdate);
  }, [nodes]);

  const fitView = useCallback(() => {
    if (nodes.length === 0) return;
    const bounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(bounds, {
      width: window.innerWidth,
      height: window.innerHeight,
    }, { minZoom: 0.5, maxZoom: 2 }, 0.5);
    setViewport(viewport);
  }, [nodes, setViewport]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as Node<HistoricalNodeData>[];
      setNodes(updatedNodes);
      window.dispatchEvent(new CustomEvent('nodesChange', { detail: updatedNodes }));
    },
    [nodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges) as Edge<HistoricalEdgeData>[];
      setEdges(updatedEdges);
      window.dispatchEvent(new CustomEvent('edgesChange', { detail: updatedEdges }));
    },
    [edges]
  );

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setEdgeSourceNode(params.source);
      setEdgeTargetNode(params.target);
      setIsEdgeDialogOpen(true);
    }
  }, []);

  // Auto layout function
  const autoLayoutNodes = useCallback(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { 
        width: 200,  // Default width
        height: 100  // Default height
      });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
        style: {
          ...node.style,
          width: nodeWithPosition.width,
          height: nodeWithPosition.height,
        },
      };
    });

    setNodes(newNodes);
  }, [nodes, edges]);

  if (!isMounted) return null;

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        minZoom={0.1}
        maxZoom={4}
      >
        <Background />
        <Controls />
        
        <div className="absolute left-0 top-0 z-10 p-4">
          <LeftPanel
            onFitView={fitView}
            onDownloadPDF={() => {}}
            onAddNode={() => {}}
            onAnalyzeText={async () => {}}
            onAutoLayout={autoLayoutNodes}
            distributeNodesEvenly={() => {}}
          />
        </div>
        
        <div className="absolute right-0 top-0 z-10 p-4">
          <RightPanel
            highlights={highlights}
            onCreateNodeFromHighlight={() => {}}
          />
        </div>
      </ReactFlow>

      <EdgeDialog
        isOpen={isEdgeDialogOpen}
        onClose={() => setIsEdgeDialogOpen(false)}
        onConfirm={() => {}}
        defaultType="related-to"
      />
    </div>
  );
};

export default function Flow({ initialEdges, initialNodes }: FlowProps) {
  return (
    <ReactFlowProvider>
      <FlowContent initialEdges={initialEdges} initialNodes={initialNodes} />
    </ReactFlowProvider>
  );
}
