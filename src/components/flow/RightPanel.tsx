// src/components/flow/RightPanel.tsx
import { useState, useEffect } from 'react';
import { NodeType } from '../HistoricalNode';

export interface Highlight {
  id: string;
  text: string;
}

export interface RightPanelProps {
  highlights: Highlight[];
  onCreateNodeFromHighlight: (highlight: { id: string; text: string }, type: NodeType) => void;
}

export function RightPanel({ highlights, onCreateNodeFromHighlight }: RightPanelProps) {
  // Maintain a mapping from highlight id to a selected node type.
  const [selectedTypes, setSelectedTypes] = useState<Record<string, NodeType>>({});

  // When highlights update, initialize new entries with the default type.
  useEffect(() => {
    setSelectedTypes((prev) => {
      const newSelectedTypes: Record<string, NodeType> = { ...prev };
      highlights.forEach((highlight) => {
        if (!newSelectedTypes[highlight.id]) {
          newSelectedTypes[highlight.id] = 'event';
        }
      });
      return newSelectedTypes;
    });
  }, [highlights]);

  const handleTypeChange = (highlightId: string, newType: NodeType) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [highlightId]: newType,
    }));
  };

  const handleCreateNode = (highlight: Highlight) => {
    const type = selectedTypes[highlight.id] || 'event';
    onCreateNodeFromHighlight({ id: highlight.id, text: highlight.text }, type);
  };

  return (
    <aside className="fixed right-0 top-0 h-full w-64 p-4 z-50 bg-[#102239e6] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-white overlay-progress-text">Highlights</h2>
      {highlights.length === 0 ? (
        <p className="text-white">No highlights available.</p>
      ) : (
        <ul>
          {highlights.map((highlight) => (
            <li key={highlight.id} className="mb-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-medium text-white">{highlight.text}</span>
                <div className="flex items-center justify-between">
                  <select
                    value={selectedTypes[highlight.id] || 'event'}
                    onChange={(e) => handleTypeChange(highlight.id, e.target.value as NodeType)}
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[
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
                      'other'
                    ].map((type) => (
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
      )}
    </aside>
  );
}
