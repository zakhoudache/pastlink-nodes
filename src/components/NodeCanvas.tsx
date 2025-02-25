// 'use client';

// import React, { useState, useEffect } from 'react';
// import HistoricalNode, { HistoricalNodeData } from './HistoricalNode';

// export interface NodeWithPosition {
//   id: string;
//   data: HistoricalNodeData;
//   position?: { x: number; y: number };
// }

// interface NodeCanvasProps {
//   nodes: NodeWithPosition[];
// }

// export default function NodeCanvas({ nodes }: NodeCanvasProps) {
//   const [positionedNodes, setPositionedNodes] = useState<NodeWithPosition[]>([]);

//   useEffect(() => {
//     // Auto layout using a simple grid distribution.
//     const numNodes = nodes.length;
//     // Determine the number of columns (e.g., square-root based layout)
//     const numColumns = Math.ceil(Math.sqrt(numNodes));
//     const spacingX = 250; // horizontal spacing between nodes
//     const spacingY = 150; // vertical spacing between nodes

//     const computedNodes = nodes.map((node, index) => {
//       const row = Math.floor(index / numColumns);
//       const col = index % numColumns;
//       return {
//         ...node,
//         position: {
//           x: col * spacingX,
//           y: row * spacingY,
//         },
//       };
//     });
//     setPositionedNodes(computedNodes);
//   }, [nodes]);

//   return (
//     <div className="relative w-full h-full">
//       {positionedNodes.map((node) => (
//         <div
//           key={node.id}
//           className="absolute"
//           style={{ left: node.position?.x, top: node.position?.y }}
//         >
//           <HistoricalNode
//             data={node.data}
//             id={node.id}
//             isConnectable={true}
//             selected={false}
//           />
//         </div>
//       ))}
//     </div>
//   );
// }