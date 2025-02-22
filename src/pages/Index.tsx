// HomePage.tsx
import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import Analysis from './Analysis';
import Flow from './Flow';
import { getNodePosition } from '../utils/flowUtils';

interface Relationship {
  source: string;
  target: string;
  type: string;
}

export default function HomePage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const handleAnalysisComplete = useCallback((relationships: Relationship[]) => {
    const newNodes = relationships.flatMap(rel => {
      const existingSourceNode = nodes.find(n => n.id === rel.source);
      const existingTargetNode = nodes.find(n => n.id === rel.target);
      return [!existingSourceNode ? {
        id: rel.source,
        type: 'historical',
        position: getNodePosition(nodes),
        data: {
          type: 'event',
          label: rel.source
        }
      } : null, !existingTargetNode ? {
        id: rel.target,
        type: 'historical',
        position: getNodePosition(nodes),
        data: {
          type: 'event',
          label: rel.target
        }
      } : null].filter(Boolean);
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

    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
  }, [nodes]);

  return (
    <div className="h-screen"> {/* Make sure it takes up the full screen height */}
      <header className="bg-gray-100 p-4 shadow-md">
        <h1 className="text-2xl font-semibold">Historical Analysis Tool</h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-[calc(100vh-64px)]"> {/* Responsive grid and calculate height */}
        <div className="h-full overflow-auto rounded-lg shadow-lg border bg-white/80">
          <div className="p-4 py-[12px] px-[17px] my-[7px]">
            <Analysis onAnalysisComplete={handleAnalysisComplete} />
          </div>
        </div>
        <div className="h-full overflow-hidden rounded-lg shadow-lg border bg-white/80">
          <Flow initialNodes={nodes} initialEdges={edges} onNodesChange={setNodes} onEdgesChange={setEdges} />
        </div>
      </div>
    </div>
  );
}