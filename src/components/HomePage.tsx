// src/components/HomePage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import Analysis from './Analysis';
import Flow from './Flow';
import { getNodePosition } from '../utils/flowUtils';
import { Toaster, toast } from 'sonner';

interface Relationship {
  source: string;
  target: string;
  type: string;
}

export default function HomePage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // UseEffect to listen for node and edge updates from the Flow component.
  useEffect(() => {
    const handleNodesChange = (e: CustomEvent<Node[]>) => { // Type the event
      setNodes(e.detail);
    };

    const handleEdgesChange = (e: CustomEvent<Edge[]>) => { // Type the event
      setEdges(e.detail);
    };

    window.addEventListener('nodesChange', handleNodesChange as EventListener); // Cast to EventListener
    window.addEventListener('edgesChange', handleEdgesChange as EventListener); // Cast to EventListener

    return () => {
      window.removeEventListener('nodesChange', handleNodesChange as EventListener); // Cast
      window.removeEventListener('edgesChange', handleEdgesChange as EventListener); // Cast
    };
  }, []);

  const handleAnalysisComplete = useCallback((relationships: Relationship[]) => {
    const newNodes = relationships.flatMap(rel => {
      const existingSourceNode = nodes.find(n => n.id === rel.source);
      const existingTargetNode = nodes.find(n => n.id === rel.target);
      return [
        !existingSourceNode ? {
          id: rel.source,
          type: 'historical',
          position: getNodePosition(nodes),
          data: {
            type: 'event',
            label: rel.source
          }
        } : null,
        !existingTargetNode ? {
          id: rel.target,
          type: 'historical',
          position: getNodePosition(nodes),
          data: {
            type: 'event',
            label: rel.target
          }
        } : null
      ].filter(Boolean);
    });

    const newEdges = relationships.map(rel => ({
      id: `e${rel.source}-${rel.target}`,
      source: rel.source,
      target: rel.target,
      type: 'historical',
      data: {
        type: rel.type
      }
    }));
    setNodes(prevNodes => {
      const mergedNodes = [...prevNodes];
      newNodes.forEach((newNode: any) => { // Explicitly type newNode
        if (!mergedNodes.some(n => n.id === newNode.id)) {
          mergedNodes.push(newNode);
        }
      });
      return mergedNodes;
    });
    setEdges(prevEdges => {
      const mergedEdges = [...prevEdges];
      newEdges.forEach(newEdge => {
        if (!mergedEdges.some(e => e.id === newEdge.id)) {
          mergedEdges.push(newEdge);
        }
      });
      return mergedEdges;
    });

  }, [nodes]);



  return (
    <div className="flex flex-col lg:flex-row h-screen"> {/* Use flex for layout */}
      <Toaster />
      <div className="lg:w-1/2 p-4 border-r border-gray-200 overflow-auto">
        {/* Analysis section takes up half the space */}
        <Analysis onAnalysisComplete={handleAnalysisComplete} />
      </div>
      <div className="lg:w-1/2 h-full">
        {/* Flow section takes up the other half and fills height */}
        <Flow initialNodes={nodes} initialEdges={edges} />
      </div>
    </div>
  );
}