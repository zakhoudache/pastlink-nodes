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
import HistoricalNode, { NodeType, HistoricalNodeData } from './HistoricalNode';
import { HistoricalEdge, HistoricalEdgeData } from './HistoricalEdge';
import { EdgeDialog } from './EdgeDialog';
import { getNodePosition, getNodesBounds } from '../utils/flowUtils';
import { useHighlightStore } from '../utils/highlightStore';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

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
        const viewport = getViewportForBounds(
            bounds,
            window.innerWidth,
            window.innerHeight,
            0.5,
            2
        );
        setViewport(viewport);
    }, [nodes, setViewport]);
    const downloadAsPDF = useCallback(() => {
        if (nodes.length === 0) return;

        const flowElement = document.querySelector('.react-flow') as HTMLElement | null;
        if (!flowElement) return;

        // Get the flow wrapper element
        const flowWrapper = flowElement.querySelector('.react-flow__viewport') as HTMLElement | null;
        if (!flowWrapper) return;

        // Calculate the bounds of all nodes
        const nodesBounds = getNodesBounds(nodes);
        const padding = 50;
        const width = nodesBounds.width + (padding * 2);
        const height = nodesBounds.height + (padding * 2);

        // Save current styles
        const currentTransform = flowWrapper.style.transform;
        const currentWidth = flowWrapper.style.width;
        const currentHeight = flowWrapper.style.height;

        // Temporarily modify the wrapper
        flowWrapper.style.width = `${width}px`;
        flowWrapper.style.height = `${height}px`;
        flowWrapper.style.transform = 'translate(0,0) scale(1)';

        toPng(flowWrapper, {
            backgroundColor: '#ffffff',
            width,
            height,
            style: {
                width: `${width}px`,
                height: `${height}px`,
            },
            filter: (node) => {
                // Only include nodes and edges
                return (
                    node.classList?.contains('react-flow__node') ||
                    node.classList?.contains('react-flow__edge') ||
                    node.classList?.contains('react-flow__edge-path') ||
                    node.classList?.contains('react-flow__connection-path')
                );
            }
        })
            .then((dataUrl) => {
                const pdf = new jsPDF({
                    orientation: width > height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [width, height]
                });

                pdf.addImage(dataUrl, 'PNG', padding, padding, width - (padding * 2), height - (padding * 2));
                pdf.save('historical-flow.pdf');

                // Restore original styles
                flowWrapper.style.transform = currentTransform;
                flowWrapper.style.width = currentWidth;
                flowWrapper.style.height = currentHeight;
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
                <LeftPanel
                    onFitView={fitView}
                    onDownloadPDF={downloadAsPDF}
                    onAddNode={addNode}
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