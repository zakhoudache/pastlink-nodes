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
import { NodeContextPanel } from './flow/NodeContextPanel';
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
  highlights: Highlight[];
  onAddHighlight: (text: string) => void; // Add the onAddHighlight prop
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
}

const FlowContent: React.FC<FlowProps> = ({ initialNodes, initialEdges, highlights, onAddHighlight, onNodesChange, onEdgesChange }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: HistoricalNodeData } | null>(null);
  const [newHighlightText, setNewHighlightText] = useState('');

  const { setViewport } = useReactFlow();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleCloseContext = () => {
      setSelectedNode(null);
    };
    window.addEventListener('closeNodeContext', handleCloseContext);
    return () => window.removeEventListener('closeNodeContext', handleCloseContext);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<HistoricalNodeData>) => {
    setSelectedNode({ id: node.id, data: node.data });
  }, []);

  const fitView = useCallback(() => {
    if (initialNodes.length === 0) return;
    const bounds = getNodesBounds(initialNodes);
    const viewport = getViewportForBounds(bounds, {
      width: window.innerWidth,
      height: window.innerHeight,
    }, { minZoom: 0.5, maxZoom: 2 }, 0.5);
    setViewport(viewport);
  }, [initialNodes, setViewport]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setEdgeSourceNode(params.source);
      setEdgeTargetNode(params.target);
      setIsEdgeDialogOpen(true);
    }
  }, []);

  const detectLayoutOrientation = useCallback(() => {
    if (initialNodes.length < 2) return 'vertical';

    let maxHorizontalDist = 0;
    let maxVerticalDist = 0;

    for (let i = 0; i < initialNodes.length; i++) {
      for (let j = i + 1; j < initialNodes.length; j++) {
        const horizontalDist = Math.abs(initialNodes[i].position.x - initialNodes[j].position.x);
        const verticalDist = Math.abs(initialNodes[i].position.y - initialNodes[j].position.y);
        maxHorizontalDist = Math.max(maxHorizontalDist, horizontalDist);
        maxVerticalDist = Math.max(maxVerticalDist, verticalDist);
      }
    }

    return maxHorizontalDist > maxVerticalDist ? 'horizontal' : 'vertical';
  }, [initialNodes]);

  const downloadAsPDF = useCallback(() => {
    if (initialNodes.length === 0) {
      toast.error('No nodes to export');
      return;
    }

    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) {
      toast.error('Could not find flow element');
      return;
    }

    const flowWrapper = flowElement.querySelector('.react-flow__viewport') as HTMLElement || flowElement;
    const nodesBounds = getNodesBounds(initialNodes);
    const orientation = detectLayoutOrientation();

    const padding = 50;
    let width = nodesBounds.width + padding * 2;
    let height = nodesBounds.height + padding * 2;

    if (orientation === 'horizontal') {
      if (width / height > 2) {
        height = Math.max(height, width / 2);
      }
    } else {
      if (height / width > 2) {
        width = Math.max(width, height / 2);
      }
    }

    const originalStyle = {
      width: flowWrapper.style.width,
      height: flowWrapper.style.height,
      transform: flowWrapper.style.transform,
    };

    const optimalZoom = Math.min(
      (width - padding * 2) / nodesBounds.width,
      (height - padding * 2) / nodesBounds.height
    );

    flowWrapper.style.width = `${width}px`;
    flowWrapper.style.height = `${height}px`;
    flowWrapper.style.transform = `translate(${padding}px, ${padding}px) scale(${optimalZoom})`;

    toast.promise(
      new Promise((resolve, reject) => {
        requestAnimationFrame(() => {
          toPng(flowWrapper, {
            backgroundColor: '#ffffff',
            width,
            height,
            style: {
              width: `${width}px`,
              height: `${height}px`,
            },
          })
            .then((dataUrl) => {
              const pdf = new jsPDF({
                orientation: orientation === 'horizontal' ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height],
              });

              pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
              pdf.save('historical-flow.pdf');
              resolve('PDF generated successfully');
            })
            .catch((error) => {
              console.error('Failed to generate PDF:', error);
              reject(new Error('Failed to generate PDF'));
            })
            .finally(() => {
              flowWrapper.style.width = originalStyle.width;
              flowWrapper.style.height = originalStyle.height;
              flowWrapper.style.transform = originalStyle.transform;
            });
        });
      }),
      {
        loading: 'Generating PDF...',
        success: 'PDF downloaded successfully',
        error: 'Failed to generate PDF',
      }
    );
  }, [initialNodes, detectLayoutOrientation]);

  // Function to handle adding a new highlight
  const handleAddHighlightClick = () => {
    if (newHighlightText.trim() !== '') {
      onAddHighlight(newHighlightText);
      setNewHighlightText(''); // Clear the input field
    }
  };

  if (!isMounted) return null;

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
      >
        <Background />
        <Controls />

        <div className="absolute left-0 top-0 z-10 p-4">
          <LeftPanel
            onFitView={fitView}
            onDownloadPDF={downloadAsPDF}
            onAddNode={() => {}}
            onAnalyzeText={async () => {}}
            onAutoLayout={() => { }}
            distributeNodesEvenly={() => {}}
          />
        </div>

        {/* Input field and button to add new highlights */}
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md z-10">
          <input
            type="text"
            placeholder="Enter highlight text"
            value={newHighlightText}
            onChange={(e) => setNewHighlightText(e.target.value)}
            className="border rounded p-1 mr-2"
          />
          <button onClick={handleAddHighlightClick} className="bg-blue-500 text-white p-1 rounded hover:bg-blue-700">
            Add Highlight
          </button>
        </div>
      </ReactFlow>

      <EdgeDialog
        isOpen={isEdgeDialogOpen}
        onClose={() => setIsEdgeDialogOpen(false)}
        onConfirm={() => {}}
        defaultType="related-to"
      />

      {selectedNode && (
        <div className="fixed right-0 top-0 h-full w-80 z-50 bg-background border-l shadow-lg">
          <NodeContextPanel selectedNode={selectedNode} />
        </div>
      )}
    </div>
  );
};

export default FlowContent;