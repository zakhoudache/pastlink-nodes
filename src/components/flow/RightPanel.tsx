// src/components/flow/RightPanel.tsx
import { useState, useEffect } from 'react';
import { NodeType } from '../HistoricalNode';

export interface Highlight {
  id: string;
  text: string;
}

export interface RightPanelProps {
  highlights: Highlight[];
  onCreateNodeFromHighlight: (highlight: Highlight, type: string) => void; // Changed type
}

export function RightPanel({ highlights, onCreateNodeFromHighlight }: RightPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<Record<string, NodeType>>({});

  useEffect(() => {
    // Initialize selected types based on incoming highlights
    setSelectedTypes((prev) => {
      const newSelectedTypes: Record<string, NodeType> = { ...prev };
      highlights.forEach((highlight) => {
        if (!newSelectedTypes[highlight.id]) {
          newSelectedTypes[highlight.id] = 'event'; // Default type
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
    onCreateNodeFromHighlight(highlight, type); // Call with Highlight object and string type
  };

  return (
    <aside
      className="
        w-64
        p-4
        bg-white
        border-l border-gray-300
        shadow-lg
        overflow-y-auto
      "
    >
      <h2 className="text-lg font-semibold mb-4">Highlights</h2>

      {highlights.length === 0 ? (
        <p>No highlights available.</p>
      ) : (
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