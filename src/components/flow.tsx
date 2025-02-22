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
import { RightPanel, Highlight } from './flow/RightPanel'; //Import the RightPanel highlight interface
import dagre from 'dagre';
import NodeCanvas from './NodeCanvas';  // Import the NodeCanvas component


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
  const [useAutoLayout, setUseAutoLayout] = useState(false);  // State to toggle auto layout
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
    const viewport = getViewportForBounds(
      bounds,
      {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      {
        minZoom: 0.5,
        maxZoom: 2,
      },
      0.5,
      [24, 24],
      { x: 0, y: 0 }
    );
    setViewport(viewport);
  }, [nodes, setViewport]);

  const downloadAsPDF = useCallback(() => {
    if (nodes.length === 0) return;
    const flowElement = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowElement) return;
    const flowWrapper =
      (flowElement.querySelector('.react-flow__viewport') as HTMLElement | null) ||
      flowElement;
    const nodesBounds = getNodesBounds(nodes);
    const padding = 50;
    const width = nodesBounds.width + padding * 2;
    const height = nodesBounds.height + padding * 2;
    const originalStyle = {
      width: flowWrapper.style.width,
      height: flowWrapper.style.height,
      transform: flowWrapper.style.transform,
    };
    flowWrapper.style.width = `${width}px`;
    flowWrapper.style.height = `${height}px`;
    flowWrapper.style.transform = 'translate(0, 0) scale(1)';
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
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [width, height],
          });
          pdf.addImage(dataUrl, 'PNG', padding, padding, width - padding * 2, height - padding * 2);
          pdf.save('historical-flow.pdf');
        })
        .catch((err) => {
          console.error('Failed to generate PDF:', err);
          toast.error('Failed to generate PDF');
        })
        .finally(() => {
          flowWrapper.style.width = originalStyle.width;
          flowWrapper.style.height = originalStyle.height;
          flowWrapper.style.transform = originalStyle.transform;
        });
    });
  }, [nodes]);

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
      window.dispatchEvent(
        new CustomEvent('edgesChange', { detail: [...edges, newEdge] })
      );
      setEdgeSourceNode(null);
      setEdgeTargetNode(null);
      setIsEdgeDialogOpen(false);
    },
    [edgeSourceNode, edgeTargetNode, edges]
  );

  const removeHighlight = useCallback(
    (id: string) => {
      setHighlights((prevHighlights) => prevHighlights.filter((highlight) => highlight.id !== id));
    },
    []
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
      window.dispatchEvent(new CustomEvent('nodesChange', { detail: [...nodes, newNode] }));
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
      window.dispatchEvent(new CustomEvent('nodesChange', { detail: [...nodes, newNode] }));
    },
    [nodes]
  );

  // Auto layout function using Dagre to position nodes logically without overlapping
  const autoLayoutNodes = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', marginx: 50, marginy: 50 });
    nodes.forEach((node) => {
      const nodeWidth = 160;
      const nodeHeight = 200;
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
    dagre.layout(dagreGraph);
    const updatedNodes = nodes.map((node) => {
      const nodeWithPos = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPos.x - nodeWithPos.width / 2,
          y: nodeWithPos.y - nodeWithPos.height / 2,
        },
      };
    });
    setNodes(updatedNodes);
  }, [nodes, edges]);

  const analyzeTextFromResponse = useCallback(
    async (text: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          }
        );
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }
        const data = await response.json();
        if (data.relationships && Array.isArray(data.relationships)) {
          let updatedNodes = [...nodes];
          let updatedEdges = [...edges];
          data.relationships.forEach((rel: any) => {
            const { source, target, type } = rel;
            let sourceNode = updatedNodes.find((node) => node.data.label === source);
            if (!sourceNode) {
              sourceNode = {
                id: `node-${source}-${Date.now()}`,
                type: 'historical',
                position: getNodePosition(updatedNodes),
                data: { type: 'historical', label: source, description: '' },
              };
              updatedNodes.push(sourceNode);
            }
            let targetNode = updatedNodes.find((node) => node.data.label === target);
            if (!targetNode) {
              targetNode = {
                id: `node-${target}-${Date.now()}`,
                type: 'historical',
                position: getNodePosition(updatedNodes),
                data: { type: 'historical', label: target, description: '' },
              };
              updatedNodes.push(targetNode);
            }
            const edgeId = `edge-${sourceNode.id}-${targetNode.id}`;
            if (!updatedEdges.some((edge) => edge.id === edgeId)) {
              updatedEdges.push({
                id: edgeId,
                source: sourceNode.id,
                target: targetNode.id,
                type: 'historical',
                data: { type, customLabel: '' },
                animated: true,
              });
            }
          });
          setNodes(updatedNodes);
          setEdges(updatedEdges);
          window.dispatchEvent(new CustomEvent('nodesChange', { detail: updatedNodes }));
          window.dispatchEvent(new CustomEvent('edgesChange', { detail: updatedEdges }));
          fitView();
          toast.success('Analysis complete and nodes created!');
        } else if (data.highlights && Array.isArray(data.highlights)) {
          // Update highlights state with analyzed highlights
          setHighlights(data.highlights);
          toast.success('Text analyzed and highlights generated!');
        }
      } catch (error: any) {
        console.error('Analysis error:', error);
        alert('An error occurred during analysis');
      }
    },
    [nodes, edges, fitView]
  );

  // Simple grid distribution layout
  const distributeNodesEvenly = useCallback(() => {
    const numNodes = nodes.length;
    const numColumns = Math.ceil(Math.sqrt(numNodes));
    const spacingX = 250;
    const spacingY = 150;

    const updatedNodes = nodes.map((node, index) => {
      const row = Math.floor(index / numColumns);
      const col = index % numColumns;
      return {
        ...node,
        position: {
          x: col * spacingX,
          y: row * spacingY,
        },
      };
    });
    setNodes(updatedNodes);
  }, [nodes]);


  if (!isMounted) return null;

  return (
    <div className="h-full w-full">

      {/* Conditionally render either ReactFlow or NodeCanvas based on autoLayout state */}
      {useAutoLayout ? (
        <NodeCanvas nodes={nodes} />
      ) : (
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
        </ReactFlow>
      )}

      <LeftPanel
        onFitView={fitView}
        onDownloadPDF={downloadAsPDF}
        onAddNode={addNode}
        onAnalyzeText={analyzeTextFromResponse}
        onAutoLayout={autoLayoutNodes}
        distributeNodesEvenly={distributeNodesEvenly}  // Pass the new function

        // Button to toggle between ReactFlow and NodeCanvas layouts
        additionalButtons={[
          {
            label: useAutoLayout ? 'Switch to ReactFlow' : 'Switch to Auto Layout',
            onClick: () => setUseAutoLayout(!useAutoLayout),
          },
        ]}
      />
      <RightPanel
        highlights={highlights}
        onCreateNodeFromHighlight={createNodeFromHighlight}
      />
      <EdgeDialog
        isOpen={isEdgeDialogOpen}
        onClose={() => setIsEdgeDialogOpen(false)}
        onConfirm={handleEdgeComplete}
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