// Flow.tsx
'use client';

import { useCallback, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHighlightStore } from '../utils/highlightStore';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  EdgeTypes,
  MarkerType,
  Background,
  Controls,
  Edge,
  Node,
  NodeChange,
  Connection,
  EdgeChange,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  getViewportForBounds,
  useReactFlow,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn } from 'lucide-react';
import HistoricalNode, { NodeType, HistoricalNodeData } from '../components/HistoricalNode';
import { HistoricalEdge, HistoricalEdgeData } from '../components/HistoricalEdge';
import { EdgeDialog } from './EdgeDialog';  // Import it here

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

const initialNodes: Node<HistoricalNodeData>[] = [];
const initialEdges: Edge<HistoricalEdgeData>[] = [];


const getNodePosition = (nodes: Node[]): { x: number; y: number } => {
  if (nodes.length === 0) return { x: 100, y: 100 };

  const lastNode = nodes[nodes.length - 1];
  return {
    x: lastNode.position.x + 250,
    y: lastNode.position.y,
  };
};

// Custom function to calculate the bounding rectangle of nodes
const getNodesBounds = (nodes: Node[]): { x: number; y: number; width: number; height: number } => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const x = node.position.x;
    const y = node.position.y;
    // Use node.width and node.height if available; otherwise, assume defaults
    const width = node.width || 240; // e.g., 'w-60' in Tailwind is 240px
    const height = node.height || 100; // Adjust based on your node design
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  // Add padding to ensure all nodes are captured
  const padding = 50;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
  };
};

export default function Flow() {
  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>(initialEdges);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);

  const { highlights, removeHighlight } = useHighlightStore();
  const { setViewport } = useReactFlow();

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
    };

    window.addEventListener('updateNodeData', handleNodeUpdate);
    return () => window.removeEventListener('updateNodeData', handleNodeUpdate);
  }, []);

  const fitView = useCallback(() => {
    if (nodes.length === 0) return;
    const bounds = getNodesBounds(nodes);
    const { x, y, zoom } = getViewportForBounds(
      bounds,
      window.innerWidth,
      window.innerHeight,
      0.5,
      2
    );
    setViewport({ x, y, zoom });
  }, [nodes, setViewport]);

  const downloadAsPDF = useCallback(() => {
    if (nodes.length === 0) return;
    const nodesBounds = getNodesBounds(nodes);
    const { x, y, zoom } = getViewportForBounds(nodesBounds, nodesBounds.width, nodesBounds.height, 0.5);
    const flowElement = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowElement) return;

    toPng(flowElement, {
      backgroundColor: '#ffffff',
      width: nodesBounds.width,
      height: nodesBounds.height,
      style: { transform: `translate(${x}px, ${y}px) scale(${zoom})` },
    }).then((dataUrl) => {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [nodesBounds.width, nodesBounds.height],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, nodesBounds.width, nodesBounds.height);
      pdf.save('historical-flow.pdf');
    });
  }, [nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setEdgeSourceNode(params.source);
      setEdgeTargetNode(params.target);
      setIsEdgeDialogOpen(true);
    }
  }, []);

  const handleEdgeComplete = useCallback(
    (type: string, customLabel?: string) => {
      if (!edgeSourceNode || !edgeTargetNode) return;
      const edgeId = `e${edgeSourceNode}-${edgeTargetNode}`;
      const newEdge: Edge<HistoricalEdgeData> = {
        id: edgeId,
        source: edgeSourceNode,
        target: edgeTargetNode,
        type: 'historical',
        data: { type, customLabel },
        animated: true,
      };
      setEdges((eds) => [...eds, newEdge]);
      setEdgeSourceNode(null);
      setEdgeTargetNode(null);
      setIsEdgeDialogOpen(false);
    },
    [edgeSourceNode, edgeTargetNode]
  );

  const createNodeFromHighlight = useCallback(
    (highlight: { id: string; text: string }, type: NodeType) => {
      const position = getNodePosition(nodes);
      const newNode: Node<HistoricalNodeData> = {
        id: highlight.id,
        type: 'historical',
        position,
        data: { type, label: highlight.text, description: '' },
      };
      setNodes((nds) => [...nds, newNode]);
      removeHighlight(highlight.id);
    },
    [nodes, removeHighlight]
  );

  const addNode = useCallback(
    (type: NodeType) => {
      const newNode: Node<HistoricalNodeData> = {
        id: `${Date.now()}`,
        type: 'historical',
        position: getNodePosition(nodes),
        data: { type, label: `New ${type}`, description: `Description for new ${type}` },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes]
  );

  if (!isMounted) return null;

  return (
    <div className="h-screen w-full">
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
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fitView} className="flex items-center gap-2">
              <ZoomIn size={16} />
              Fit View
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsPDF} className="flex items-center gap-2">
              <Download size={16} />
              حفظ كـ PDF
            </Button>
          </div>
        </Panel>
        <Panel position="top-right" className="bg-background/50 backdrop-blur-sm p-4 rounded-lg w-80">
          <div className="space-y-4">
            <h3 className="font-semibold">Highlighted Passages</h3>
            {highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No highlights available. Select text in the Analysis page to create nodes.
              </p>
            ) : (
              <div className="space-y-3">
                {highlights.map((highlight) => (
                  <Card key={highlight.id} className="p-3">
                    <p className="text-sm mb-2">{highlight.text}</p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-50 hover:bg-blue-100"
                          onClick={() => createNodeFromHighlight(highlight, 'event')}
                        >
                          Event
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 hover:bg-green-100"
                          onClick={() => createNodeFromHighlight(highlight, 'person')}
                        >
                          Person
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 hover:bg-red-100"
                          onClick={() => createNodeFromHighlight(highlight, 'cause')}
                        >
                          Cause
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-purple-50 hover:bg-purple-100"
                          onClick={() => createNodeFromHighlight(highlight, 'political')}
                        >
                          Political
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-yellow-50 hover:bg-yellow-100"
                          onClick={() => createNodeFromHighlight(highlight, 'economic')}
                        >
                          Economic
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-pink-50 hover:bg-pink-100"
                          onClick={() => createNodeFromHighlight(highlight, 'social')}
                        >
                          Social
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-indigo-50 hover:bg-indigo-100"
                          onClick={() => createNodeFromHighlight(highlight, 'cultural')}
                        >
                          Cultural
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Panel>
        <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('event')}
              className="bg-blue-50 hover:bg-blue-100"
            >
              Add Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('person')}
              className="bg-green-50 hover:bg-green-100"
            >
              Add Person
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNode('cause')}
              className="bg-red-50 hover:bg-red-100"
            >
              Add Cause
            </Button>
            <Card className="p-2">
              <p className="text-xs font-medium mb-2">PESC Factors</p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNode('political')}
                  className="bg-purple-50 hover:bg-purple-100"
                >
                  Political
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNode('economic')}
                  className="bg-yellow-50 hover:bg-yellow-100"
                >
                  Economic
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNode('social')}
                  className="bg-pink-50 hover:bg-pink-100"
                >
                  Social
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNode('cultural')}
                  className="bg-indigo-50 hover:bg-indigo-100"
                >
                  Cultural
                </Button>
              </div>
            </Card>
          </div>
        </Panel>
      </ReactFlow>
      <EdgeDialog
        isOpen={isEdgeDialogOpen}
        onClose={() => setIsEdgeDialogOpen(false)}
        onConfirm={handleEdgeComplete}
        defaultType="related-to"
      />
    </div>
  );
}