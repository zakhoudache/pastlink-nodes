// import React, { useState, useCallback, useEffect } from 'react';
// import { Node, Edge } from '@xyflow/react';
// import Analysis from '../pages/Analysis';
// import Flow from './flow';
// import { getNodePosition } from '../utils/flowUtils';
// import { Toaster, toast } from 'sonner';
// import { HistoricalNodeData } from './HistoricalNode';
// import { HistoricalEdgeData } from './HistoricalEdge';
// interface Relationship {
//   source: string;
//   target: string;
//   type: string;
// }
// export default function HomePage() {
//   const [nodes, setNodes] = useState<Node<HistoricalNodeData>[]>([]);
//   const [edges, setEdges] = useState<Edge<HistoricalEdgeData>[]>([]);
//   useEffect(() => {
//     const handleNodesChange = (e: CustomEvent<Node<HistoricalNodeData>[]>) => {
//       setNodes(e.detail);
//     };
//     const handleEdgesChange = (e: CustomEvent<Edge<HistoricalEdgeData>[]>) => {
//       setEdges(e.detail);
//     };
//     window.addEventListener('nodesChange', handleNodesChange as EventListener);
//     window.addEventListener('edgesChange', handleEdgesChange as EventListener);
//     return () => {
//       window.removeEventListener('nodesChange', handleNodesChange as EventListener);
//       window.removeEventListener('edgesChange', handleEdgesChange as EventListener);
//     };
//   }, []);
//   const handleAnalysisComplete = useCallback((relationships: Relationship[]) => {
//     const newNodes = relationships.flatMap(rel => {
//       const existingSourceNode = nodes.find(n => n.id === rel.source);
//       const existingTargetNode = nodes.find(n => n.id === rel.target);
//       return [!existingSourceNode ? {
//         id: rel.source,
//         type: 'historical',
//         position: getNodePosition(nodes),
//         data: {
//           type: 'event' as const,
//           label: rel.source
//         }
//       } : null, !existingTargetNode ? {
//         id: rel.target,
//         type: 'historical',
//         position: getNodePosition(nodes),
//         data: {
//           type: 'event' as const,
//           label: rel.target
//         }
//       } : null].filter(Boolean);
//     });
//     const newEdges = relationships.map(rel => ({
//       id: `e${rel.source}-${rel.target}`,
//       source: rel.source,
//       target: rel.target,
//       type: 'historical',
//       data: {
//         type: rel.type
//       }
//     }));
//     setNodes(prevNodes => {
//       const mergedNodes = [...prevNodes];
//       newNodes.forEach((newNode: Node<HistoricalNodeData>) => {
//         if (!mergedNodes.some(n => n.id === newNode.id)) {
//           mergedNodes.push(newNode);
//         }
//       });
//       return mergedNodes;
//     });
//     setEdges(prevEdges => {
//       const mergedEdges = [...prevEdges];
//       newEdges.forEach(newEdge => {
//         if (!mergedEdges.some(e => e.id === newEdge.id)) {
//           mergedEdges.push(newEdge);
//         }
//       });
//       return mergedEdges;
//     });
//   }, [nodes]);
//   return <div className="flex h-screen overflow-hidden">
//       <Toaster />
//       <div className="w-1/4 min-w-[300px] max-w-md border-r border-gray-200 overflow-auto bg-gray-50">
//         <div className="p-4 py-[16px]">
//           <Analysis onAnalysisComplete={handleAnalysisComplete} />
//         </div>
//       </div>
//       <div className="flex-1 relative">
//         <Flow initialNodes={nodes} initialEdges={edges} />
//       </div>
//     </div>;
// }