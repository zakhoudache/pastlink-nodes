// src/components/flow/RightPanel.tsx
import { useState } from 'react';
import { NodeType } from '../HistoricalNode';
import { Highlight } from '../../utils/highlightStore';

export interface RightPanelProps {
  highlights: Highlight[];
  onCreateNodeFromHighlight: (highlight: { id: string; text: string }, type: NodeType) => void;
}

const nodeTypes: NodeType[] = [
  'event',
  'person',
  'cause',
  'political',
  'economic',
  'social',
  'cultural',
  'term',
  'date',
  'goal',
  'indicator',
  'country',
  'other',
];

export function RightPanel({ highlights, onCreateNodeFromHighlight }: RightPanelProps) {
  // State to track the selected node type for each highlight (defaulting to 'event')
  const [selectedTypes, setSelectedTypes] = useState<Record<string, NodeType>>({});

  const handleTypeChange = (highlightId: string, newType: NodeType) => {
    console.log(`Highlight ${highlightId}: type changed to ${newType}`);
    setSelectedTypes((prev) => ({
      ...prev,
      [highlightId]: newType,
    }));
  };

  const handleCreateNode = (highlight: Highlight) => {
    const selectedType = selectedTypes[highlight.id] || 'event';
    console.log(`Creating node for highlight ${highlight.id} with type ${selectedType}`);
    onCreateNodeFromHighlight({ id: highlight.id, text: highlight.text }, selectedType);
  };

  return (
    <aside className="absolute top-2 right-2 w-64 p-4 bg-gray-100 border-l border-gray-300 rounded-lg shadow-lg z-50">
      <h2 className="text-lg font-semibold mb-4">Highlights</h2>
      <ul>
        {highlights.map((highlight) => (
          <li key={highlight.id} className="mb-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium">{highlight.text}</span>
              <div className="flex items-center justify-between">
                <select
                  value={selectedTypes[highlight.id] || 'event'}
                  onChange={(e) => handleTypeChange(highlight.id, e.target.value as NodeType)}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nodeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleCreateNode(highlight)}
                  className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Node
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
