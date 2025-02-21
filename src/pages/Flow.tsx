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
  getRectOfNodes,
  getTransformForBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import HistoricalNode, { NodeType, HistoricalNodeData } from '../components/HistoricalNode';
import { HistoricalEdge, HistoricalEdgeData } from '../components/HistoricalEdge';

interface EdgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string, customLabel?: string) => void;
  defaultType?: string;
  defaultLabel?: string;
}

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

const relationshipTypes = [
  'Caused by',
  'Led to',
  'Influenced',
  'Part of',
  'Opposed to',
  'Related to',
];

const getNodePosition = (nodes: Node[]): { x: number; y: number } => {
  if (nodes.length === 0) return { x: 100, y: 100 };

  const lastNode = nodes[nodes.length - 1];
  return {
    x: lastNode.position.x + 250,
    y: lastNode.position.y,
  };
};

function EdgeDialog({ isOpen, onClose, onConfirm, defaultType = 'related-to', defaultLabel }: EdgeDialogProps) {
  const [customLabel, setCustomLabel] = useState<string | undefined>(defaultLabel);
  const [selectedType, setSelectedType] = useState<string>(defaultType);

  const handleConfirm = () => {
    onConfirm(selectedType, customLabel);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Relationship Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select defaultValue={defaultType} onValueChange={(value) => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase().replace(/ /g, '-')}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Custom Label (Optional)</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter custom label"
              value={customLabel || ''}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Flow() {
  const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>([]);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);

  const { highlights, removeHighlight } = useHighlightStore();

  // Listen for node data updates
  useEffect(() => {
    const handleNodeUpdate = (event: CustomEvent) => {
      const { id, data } = event.detail;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
    };

    window.addEventListener('updateNodeData', handleNodeUpdate as EventListener);
    return () => window.removeEventListener('updateNodeData', handleNodeUpdate as EventListener);
  }, []);

  const downloadAsPDF = useCallback(() => {
    const nodesBounds = getRectOfNodes(nodes);
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
    );

    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    toPng(flowElement, {
      backgroundColor: '#ffffff',
      width: nodesBounds.width,
      height: nodesBounds.height,
      style: {
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    })
      .then((dataUrl) => {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [nodesBounds.width, nodesBounds.height],
        });

        pdf.addImage(
          dataUrl,
          'PNG',
          0,
          0,
          nodesBounds.width,
          nodesBounds.height,
        );

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
    setEdgeSourceNode(params.source || null);
    setEdgeTargetNode(params.target || null);
    setIsEdgeDialogOpen(true);
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
        data: {
          type,
          label: highlight.text,
          description: '',
        },
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
        data: {
          type,
          label: `New ${type}`,
          description: `Description for new ${type}`,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes]
  );

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsPDF}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            حفظ كـ PDF
          </Button>
        </Panel>
        {/* Node Creation Panel */}
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
        {/* Node Types Panel */}
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
