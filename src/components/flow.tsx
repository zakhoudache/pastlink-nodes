// 'use client';

// import { useCallback, useState, useEffect } from 'react';
// import 'reactflow/dist/style.css';
// import { ReactFlow, ReactFlowProvider, EdgeTypes, MarkerType, Background, Controls, Edge, Node, NodeChange, Connection, EdgeChange, applyNodeChanges, applyEdgeChanges, getViewportForBounds, useReactFlow } from 'reactflow';
// import { toPng } from 'html-to-image';
// import { jsPDF } from 'jspdf';
// import { toast } from 'sonner';
// import HistoricalNode, { NodeType, HistoricalNodeData } from './HistoricalNode';
// import { HistoricalEdge, HistoricalEdgeData } from './HistoricalEdge';
// import { EdgeDialog } from './EdgeDialog';
// import { getNodePosition, getNodesBounds } from '../utils/flowUtils';
// import { LeftPanel } from './flow/LeftPanel';
// import { RightPanel, Highlight } from './flow/RightPanel';
// import dagre from 'dagre';

// const edgeTypes: EdgeTypes = {
//   historical: HistoricalEdge
// };

// const defaultEdgeOptions = {
//   type: 'historical' as const,
//   markerEnd: {
//     type: MarkerType.ArrowClosed,
//     width: 20,
//     height: 20
//   }
// };

// const nodeTypes = {
//   historical: HistoricalNode
// };

// interface FlowProps {
//   initialNodes: Node<HistoricalNodeData>[];
//   initialEdges: Edge<HistoricalEdgeData>[];
// }

// const distributeNodes = (nodes: Node[], edges: Edge[], direction: 'horizontal' | 'vertical' = 'horizontal') => {
//   const nodeWidth = 180;
//   const nodeHeight = 100;
//   const gapX = 100;
//   const gapY = 100;
//   const startX = 50;
//   const startY = 50;

//   const g = new dagre.graphlib.Graph();
//   g.setGraph({
//     rankdir: direction === 'horizontal' ? 'LR' : 'TB'
//   });
//   g.setDefaultEdgeLabel(() => ({}));

//   nodes.forEach(node => {
//     g.setNode(node.id, {
//       width: nodeWidth,
//       height: nodeHeight
//     });
//   });

//   edges.forEach(edge => {
//     g.setEdge(edge.source, edge.target);
//   });

//   dagre.layout(g);

//   return nodes.map(node => {
//     const nodeWithPosition = g.node(node.id);
//     return {
//       ...node,
//       position: {
//         x: nodeWithPosition.x - nodeWidth / 2 + startX,
//         y: nodeWithPosition.y - nodeHeight / 2 + startY
//       }
//     };
//   });
// };

// const FlowContent: React.FC<FlowProps> = ({
//   initialNodes,
//   initialEdges
// }) => {
//   const [isMounted, setIsMounted] = useState(false);
//   const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>(initialNodes);
//   const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>(initialEdges);
//   const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
//   const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
//   const [edgeTargetNode, setEdgeTargetNode] = useState<string | null>(null);
//   const [useAutoLayout, setUseAutoLayout] = useState(false);
//   const [highlights, setHighlights] = useState<Highlight[]>([]);
//   const { setViewport, getZoom } = useReactFlow();

//   useEffect(() => {
//     setNodes(initialNodes);
//     setEdges(initialEdges);
//   }, [initialNodes, initialEdges]);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   useEffect(() => {
//     const handleNodeUpdate = (event: Event) => {
//       const customEvent = event as CustomEvent<{
//         id: string;
//         data: HistoricalNodeData;
//       }>;
//       const { id, data } = customEvent.detail;
//       setNodes(nds => nds.map(node => node.id === id ? {
//         ...node,
//         data
//       } : node));
//       window.dispatchEvent(new CustomEvent('nodesChange', {
//         detail: nodes.map(node => node.id === id ? {
//           ...node,
//           data
//         } : node)
//       }));
//     };
//     window.addEventListener('updateNodeData', handleNodeUpdate);
//     return () => window.removeEventListener('updateNodeData', handleNodeUpdate);
//   }, [nodes]);

//   const fitView = useCallback(() => {
//     if (nodes.length === 0) return;
//     const bounds = getNodesBounds(nodes);
//     const viewport = getViewportForBounds(bounds, {
//       width: window.innerWidth,
//       height: window.innerHeight
//     }, {
//       minZoom: 0.5,
//       maxZoom: 2
//     }, 0.5);
//     setViewport(viewport);
//   }, [nodes, setViewport]);

//   const onNodesChange = useCallback((changes: NodeChange[]) => {
//     const updatedNodes = applyNodeChanges(changes, nodes) as Node<HistoricalNodeData>[];
//     setNodes(updatedNodes);
//     window.dispatchEvent(new CustomEvent('nodesChange', {
//       detail: updatedNodes
//     }));
//   }, [nodes]);

//   const onEdgesChange = useCallback((changes: EdgeChange[]) => {
//     const updatedEdges = applyEdgeChanges(changes, edges) as Edge<HistoricalEdgeData>[];
//     setEdges(updatedEdges);
//     window.dispatchEvent(new CustomEvent('edgesChange', {
//       detail: updatedEdges
//     }));
//   }, [edges]);

//   const onConnect = useCallback((params: Connection) => {
//     if (params.source && params.target) {
//       setEdgeSourceNode(params.source);
//       setEdgeTargetNode(params.target);
//       setIsEdgeDialogOpen(true);
//     }
//   }, []);

//   const autoLayoutNodes = useCallback(() => {
//     const g = new dagre.graphlib.Graph();
//     g.setGraph({
//       rankdir: 'TB',
//       nodesep: 100,
//       ranksep: 100
//     });
//     g.setDefaultEdgeLabel(() => ({}));

//     nodes.forEach(node => {
//       g.setNode(node.id, {
//         width: 200,
//         height: 100
//       });
//     });

//     edges.forEach(edge => {
//       g.setEdge(edge.source, edge.target);
//     });

//     dagre.layout(g);

//     const newNodes = nodes.map(node => {
//       const nodeWithPosition = g.node(node.id);
//       return {
//         ...node,
//         position: {
//           x: nodeWithPosition.x - nodeWithPosition.width / 2,
//           y: nodeWithPosition.y - nodeWithPosition.height / 2
//         },
//         style: {
//           ...node.style,
//           width: nodeWithPosition.width,
//           height: nodeWithPosition.height
//         }
//       };
//     });
//     setNodes(newNodes);
//   }, [nodes, edges]);

//   const detectLayoutOrientation = useCallback(() => {
//     if (nodes.length < 2) return 'vertical';
//     let maxHorizontalDist = 0;
//     let maxVerticalDist = 0;
//     for (let i = 0; i < nodes.length; i++) {
//       for (let j = i + 1; j < nodes.length; j++) {
//         const horizontalDist = Math.abs(nodes[i].position.x - nodes[j].position.x);
//         const verticalDist = Math.abs(nodes[i].position.y - nodes[j].position.y);
//         maxHorizontalDist = Math.max(maxHorizontalDist, horizontalDist);
//         maxVerticalDist = Math.max(maxVerticalDist, verticalDist);
//       }
//     }
//     return maxHorizontalDist > maxVerticalDist ? 'horizontal' : 'vertical';
//   }, [nodes]);

//   const downloadAsPDF = useCallback(() => {
//     if (nodes.length === 0) {
//       toast.error('No nodes to export');
//       return;
//     }

//     const flowElement = document.querySelector('.react-flow') as HTMLElement;
//     if (!flowElement) {
//       toast.error('Could not find flow element');
//       return;
//     }

//     const flowWrapper = flowElement.querySelector('.react-flow__viewport') as HTMLElement || flowElement;
//     const nodesBounds = getNodesBounds(nodes);
//     const orientation = detectLayoutOrientation();
//     const padding = 50;
//     let width = nodesBounds.width + padding * 2;
//     let height = nodesBounds.height + padding * 2;

//     if (orientation === 'horizontal') {
//       if (width / height > 2) {
//         height = Math.max(height, width / 2);
//       }
//     } else {
//       if (height / width > 2) {
//         width = Math.max(width, height / 2);
//       }
//     }

//     const originalStyle = {
//       width: flowWrapper.style.width,
//       height: flowWrapper.style.height,
//       transform: flowWrapper.style.transform
//     };

//     const optimalZoom = Math.min(
//       (width - padding * 2) / nodesBounds.width,
//       (height - padding * 2) / nodesBounds.height
//     );

//     flowWrapper.style.width = `${width}px`;
//     flowWrapper.style.height = `${height}px`;
//     flowWrapper.style.transform = `translate(${padding}px, ${padding}px) scale(${optimalZoom})`;

//     toast.promise(
//       new Promise((resolve, reject) => {
//         requestAnimationFrame(() => {
//           toPng(flowWrapper, {
//             backgroundColor: '#ffffff',
//             width,
//             height,
//             style: {
//               width: `${width}px`,
//               height: `${height}px`
//             }
//           })
//             .then(dataUrl => {
//               const pdf = new jsPDF({
//                 orientation: orientation === 'horizontal' ? 'landscape' : 'portrait',
//                 unit: 'px',
//                 format: [width, height]
//               });
//               pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
//               pdf.save('historical-flow.pdf');
//               resolve('PDF generated successfully');
//             })
//             .catch(error => {
//               console.error('Failed to generate PDF:', error);
//               reject(new Error('Failed to generate PDF'));
//             })
//             .finally(() => {
//               flowWrapper.style.width = originalStyle.width;
//               flowWrapper.style.height = originalStyle.height;
//               flowWrapper.style.transform = originalStyle.transform;
//             });
//         });
//       }),
//       {
//         loading: 'Generating PDF...',
//         success: 'PDF downloaded successfully',
//         error: 'Failed to generate PDF'
//       }
//     );
//   }, [nodes, detectLayoutOrientation]);

//   if (!isMounted) return null;

//   return (
//     <div className="h-full w-full relative">
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onConnect={onConnect}
//         nodeTypes={nodeTypes}
//         edgeTypes={edgeTypes}
//         defaultEdgeOptions={defaultEdgeOptions}
//         fitView
//         minZoom={0.1}
//         maxZoom={4}
//       >
//         <Background />
//         <Controls />
        
//         <div className="absolute left-0 top-0 z-10 p-4 my-0 py-[16px]">
//           <LeftPanel
//             onFitView={fitView}
//             onDownloadPDF={downloadAsPDF}
//             onAddNode={() => {}}
//             onAnalyzeText={async () => {}}
//             onAutoLayout={autoLayoutNodes}
//             distributeNodesEvenly={() => {}}
//           />
//         </div>
        
//         <div className="absolute right-0 top-0 z-10 p-4">
//           <RightPanel
//             highlights={highlights}
//             onCreateNodeFromHighlight={() => {}}
//           />
//         </div>
//       </ReactFlow>

//       <EdgeDialog
//         isOpen={isEdgeDialogOpen}
//         onClose={() => setIsEdgeDialogOpen(false)}
//         onConfirm={() => {}}
//         defaultType="related-to"
//       />
//     </div>
//   );
// };

// export default function Flow({
//   initialEdges,
//   initialNodes
// }: FlowProps) {
//   return (
//     <ReactFlowProvider>
//       <FlowContent initialEdges={initialEdges} initialNodes={initialNodes} />
//     </ReactFlowProvider>
//   );
// }
