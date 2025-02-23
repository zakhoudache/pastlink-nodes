'use client';

import { useState, useCallback } from 'react';
import { ReactFlowProvider, addEdge, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import FlowContent from './FlowContent';
import { RightPanel, Highlight } from './flow/RightPanel'; // Import Highlight type
import type { Edge, Node } from '@xyflow/react';
import type { HistoricalNodeData, HistoricalEdgeData } from './HistoricalNode';
import { v4 as uuidv4 } from 'uuid';
import HistoricalNode from './HistoricalNode';
import { SidebarProvider } from '@/components/ui/sidebar';

interface FlowProps {
  initialNodes: Node<HistoricalNodeData>[];
  initialEdges: Edge<HistoricalEdgeData>[];
}

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

export default function Flow({ initialNodes, initialEdges }: FlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange, addEdge] = useEdgesState(initialEdges);

  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]); // Initialized as an empty array

  // Function to add a new highlight
  const addHighlight = useCallback((text: string) => {
    const newHighlight: Highlight = { id: uuidv4(), text };
    setHighlights((prevHighlights) => [...prevHighlights, newHighlight]);
  }, []);

  // Function to remove a highlight
  const removeHighlight = useCallback((id: string) => {
    setHighlights((prevHighlights) => prevHighlights.filter((highlight) => highlight.id !== id));
  }, []);

  // Function to handle creating a node from a highlight
  const handleCreateNodeFromHighlight = (highlight: Highlight, type: string) => {
    console.log('Creating node from highlight:', highlight, type);

    const newNodeId = uuidv4();
    const newNode: Node<HistoricalNodeData> = {
      id: newNodeId,
      type: 'historical',
      position: { x: 100, y: 100 },
      data: {
        label: highlight.text,
        type: type as HistoricalNodeData['type'],
        description: '',
      },
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
    removeHighlight(highlight.id); // Remove the highlight after node creation.
  };

  return (
    <ReactFlowProvider>
      <SidebarProvider>
        <div className="flex w-full h-screen">
          <div className="relative flex-1">
            <FlowContent
              initialEdges={edges}
              initialNodes={nodes}
              highlights={highlights}
              onAddHighlight={addHighlight} // Pass the addHighlight function to FlowContent
            />
          </div>

          <RightPanel
            highlights={highlights}
            onCreateNodeFromHighlight={handleCreateNodeFromHighlight}
          />
        </div>
      </SidebarProvider>
    </ReactFlowProvider>
  );
}