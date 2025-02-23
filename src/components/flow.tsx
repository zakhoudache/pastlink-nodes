
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
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const { setViewport } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const flowElement = document.querySelector('.react-flow');
      if (!flowElement) return;

      const dataUrl = await toPng(flowElement as HTMLElement, {
        backgroundColor: '#ffffff',
        quality: 1,
        pixelRatio: 3,
        width: flowElement.scrollWidth * 2,
        height: flowElement.scrollHeight * 2,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [flowElement.scrollWidth, flowElement.scrollHeight],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, flowElement.scrollWidth, flowElement.scrollHeight, '', 'FAST');
      pdf.save('flow-diagram.pdf');
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء تحميل الملف');
    }
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as Node<HistoricalNodeData>[]);
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as Edge<HistoricalEdgeData>[]);
    },
    []
  );

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setEdgeSourceNode(params.source);
      setEdgeTargetNode(params.target);
      setIsEdgeDialogOpen(true);
    }
  }, []);

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
        
        <div className="fixed left-4 top-4 z-50">
          <LeftPanel
            onFitView={() => {}}
            onDownloadPDF={handleDownloadPDF}
            onAddNode={() => {}}
            onAnalyzeText={async () => {}}
            onAutoLayout={() => {}}
            distributeNodesEvenly={() => {}}
          />
        </div>
        
        <div className="fixed right-4 top-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
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
