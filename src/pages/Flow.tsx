
'use client';

import { useCallback, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHighlightStore } from '../utils/highlightStore';
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
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import HistoricalNode, { NodeType, HistoricalNodeData } from '../components/HistoricalNode';
import { HistoricalEdge, HistoricalEdgeData } from '../components/HistoricalEdge';
import { getNodesBounds } from '../utils/flowUtils';

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

// Separate the main flow content into its own component
const FlowContent = () => {
  const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>([]);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);

  const { highlights, removeHighlight } = useHighlightStore();
  const { setViewport } = useReactFlow();

  // Listen for analysis results
  useEffect(() => {
    const handleAnalysisResults = (event: CustomEvent) => {
      const { entities, relationships } = event.detail;
      
      // Create nodes for each entity
      const newNodes: Node<HistoricalNodeData>[] = entities.map((entity: any, index: number) => ({
        id: `entity-${index}`,
        type: 'historical',
        position: {
          x: 100 + (index % 3) * 300,
          y: 100 + Math.floor(index / 3) * 200,
        },
        data: {
          type: entity.type.toLowerCase() as NodeType,
          label: entity.text,
          description: '',
        },
      }));

      // Create edges for relationships
      const newEdges: Edge<HistoricalEdgeData>[] = relationships.map((rel: any, index: number) => {
        const sourceNode = newNodes.find(node => node.data.label === rel.source);
        const targetNode = newNodes.find(node => node.data.label === rel.target);
        
        if (!sourceNode || !targetNode) return null;

        return {
          id: `edge-${index}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'historical',
          data: {
            type: rel.type.toLowerCase(),
          },
          animated: true,
        };
      }).filter(Boolean) as Edge<HistoricalEdgeData>[];

      setNodes(newNodes);
      setEdges(newEdges);
    };

    window.addEventListener('analysisResults', handleAnalysisResults as EventListener);
    return () => window.removeEventListener('analysisResults', handleAnalysisResults as EventListener);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<HistoricalNodeData>[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as Edge<HistoricalEdgeData>[]),
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
      </ReactFlow>
      <Dialog open={isEdgeDialogOpen} onOpenChange={setIsEdgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نوع العلاقة</DialogTitle>
          </DialogHeader>
          <Select onValueChange={(value) => handleEdgeComplete(value)} defaultValue="related-to">
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع العلاقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="related-to">مرتبط بـ</SelectItem>
              <SelectItem value="causes">يسبب</SelectItem>
              <SelectItem value="influences">يؤثر على</SelectItem>
              <SelectItem value="part-of">جزء من</SelectItem>
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrap the FlowContent with ReactFlowProvider
export default function Flow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}
