import { NodeType } from '../HistoricalNode';
import { Highlight } from '../../utils/highlightStore';

export interface RightPanelProps {
  highlights: Highlight[];
  onCreateNodeFromHighlight: (highlight: { id: string; text: string }, type: NodeType) => void;
}

export function RightPanel({ highlights, onCreateNodeFromHighlight }: RightPanelProps) {
  return (
    <aside className="w-64 p-4 bg-gray-100 border-l border-gray-300">
      <h2 className="text-lg font-semibold mb-4">Highlights</h2>
      <ul>
        {highlights.map((highlight) => (
          <li key={highlight.id} className="mb-2">
            <div className="flex items-center justify-between">
              <span>{highlight.text}</span>
              <button
                onClick={() => onCreateNodeFromHighlight(highlight, 'event')}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                Create Node
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
