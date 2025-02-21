
'use client';

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTextAnalysis } from '../services/geminiService';
import HistoricalNode from '../components/HistoricalNode';

const nodeTypes = {
  historical: HistoricalNode,
};

const getNodePosition = (index: number, totalNodes: number) => {
  const radius = Math.min(totalNodes * 50, 300);
  const angle = (index / totalNodes) * 2 * Math.PI;
  return {
    x: radius * Math.cos(angle) + 500,
    y: radius * Math.sin(angle) + 300,
  };
};

export default function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: analysis } = useTextAnalysis(localStorage.getItem('currentText') || '');

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Update nodes and edges when analysis changes
  useEffect(() => {
    if (!analysis) return;

    // Create nodes from entities
    const newNodes = analysis.entities.map((entity, index) => ({
      id: entity.text,
      type: 'historical',
      position: getNodePosition(index, analysis.entities.length),
      data: {
        type: entity.type,
        label: entity.text,
      },
    }));

    // Create edges from relationships
    const newEdges = analysis.relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.source,
      target: rel.target,
      type: 'smoothstep',
      label: rel.type,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [analysis, setNodes, setEdges]);

  return (
    <div className="h-screen" dir="rtl">
      <div className="h-full border rounded-lg overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls position="bottom-right" className="!bottom-4 !right-4" />
          <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">مخطط العلاقات التاريخية</h2>
            <p className="text-sm text-muted-foreground">
              يتم تحديث المخطط تلقائياً عند تحليل النص
            </p>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
