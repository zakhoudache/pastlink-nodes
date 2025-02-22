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
import HistoricalNode, { NodeType, HistoricalNodeData } from '../components/HistoricalNode';
import { HistoricalEdge, HistoricalEdgeData } from '../components/HistoricalEdge';
import { EdgeDialog } from '../components/EdgeDialog';
import { getNodePosition, getNodesBounds } from '../utils/flowUtils';
import { useHighlightStore } from '../utils/highlightStore';
import { LeftPanel } from '../components/flow/LeftPanel';
import { RightPanel } from '../components/flow/RightPanel';

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

const FlowContent = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>(initialEdges);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);

  const { highlights, removeHighlight, setHighlights } = useHighlightStore();
  const { setViewport } = useReactFlow();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleNodeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; data: HistoricalNodeData }>;
      const { id, data } = customEvent.detail;
      setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data } : node)));
    };

    window.addEventListener('updateNodeData', handleNodeUpdate);
    return () => window.removeEventListener('updateNodeData', handleNodeUpdate);
  }, []);

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
  
    // الحصول على العنصر الرئيسي للرسم
    const flowElement = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowElement) return;
  
    // الحصول على العنصر الذي يحتوي على العرض الفعلي (قد يكون .react-flow__viewport أو العنصر الرئيسي نفسه)
    const flowWrapper =
      flowElement.querySelector('.react-flow__viewport') as HTMLElement | null || flowElement;
  
    const nodesBounds = getNodesBounds(nodes);
    const padding = 50;
    const width = nodesBounds.width + padding * 2;
    const height = nodesBounds.height + padding * 2;
  
    // حفظ الإعدادات الحالية
    const originalStyle = {
      width: flowWrapper.style.width,
      height: flowWrapper.style.height,
      transform: flowWrapper.style.transform,
    };
  
    // تعديل الأنماط مؤقتًا لضمان التقاط المحتوى بالكامل
    flowWrapper.style.width = `${width}px`;
    flowWrapper.style.height = `${height}px`;
    flowWrapper.style.transform = 'translate(0, 0) scale(1)';
  
    // الانتظار حتى يتم تحديث التخطيط
    requestAnimationFrame(() => {
      toPng(flowWrapper, {
        backgroundColor: '#ffffff',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
        },
        // يمكن تجربة إزالة الفلتر أو تعديله إذا كان يمنع التقاط بعض العناصر
        // filter: (node) => true,
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
          // إعادة الإعدادات الأصلية بعد الانتهاء
          flowWrapper.style.width = originalStyle.width;
          flowWrapper.style.height = originalStyle.height;
          flowWrapper.style.transform = originalStyle.transform;
        });
    });
  }, [nodes]);
  
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

  // الدالة المحدثة لتحليل النص وإنشاء العقد والحواف تلقائيًا بناءً على استجابة التحليل
  const analyzeTextFromResponse = useCallback(
    async (text: string) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }

        const data = await response.json();
        if (data.relationships && Array.isArray(data.relationships)) {
          // استنساخ العقد والحواف الحالية
          let updatedNodes = [...nodes];
          let updatedEdges = [...edges];

          data.relationships.forEach((rel: any) => {
            const { source, target, type } = rel;

            // إنشاء عقدة للمصدر إذا لم تكن موجودة
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

            // إنشاء عقدة للهدف إذا لم تكن موجودة
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

            // إنشاء حافة تربط بين العقدتين
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
          fitView();
          toast.success("Analysis complete and nodes created!");
        }
      } catch (error: any) {
        console.error("Analysis error:", error);
        alert("An error occurred during analysis");
      }
    },
    [nodes, edges, fitView]
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
        <LeftPanel
          onFitView={fitView}
          onDownloadPDF={downloadAsPDF}
          onAddNode={addNode}
          onAnalyzeText={analyzeTextFromResponse}
        />
        <RightPanel
          highlights={highlights}
          onCreateNodeFromHighlight={createNodeFromHighlight}
        />
      </ReactFlow>
      <EdgeDialog
        isOpen={isEdgeDialogOpen}
        onClose={() => setIsEdgeDialogOpen(false)}
        onConfirm={handleEdgeComplete}
        defaultType="related-to"
      />
    </div>
  );
};

export default function Flow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}
