import { NodeType } from '../HistoricalNode';
    import { Highlight } from '../../utils/highlightStore';
    import { Button } from "@/components/ui/button";

    export interface RightPanelProps {
      highlights: Highlight[];
      onCreateNodeFromHighlight: (highlight: { id: string; text: string }, type: NodeType) => void;
      className?: string; // Add className prop
    }

    export function RightPanel({ highlights, onCreateNodeFromHighlight, className }: RightPanelProps) {
      return (
        <aside className={`w-64 p-4 bg-gray-100 border-l border-gray-300 ${className}`}> {/* Apply className */}
          <h2 className="text-lg font-semibold mb-4">Highlights</h2>
          <ul className="space-y-2 overflow-y-auto h-96"> {/* Scrollable list */}
            {highlights.map((highlight) => (
              <li key={highlight.id} className="mb-2">
                <div className="flex items-center justify-between">
                  <span>{highlight.text}</span>
                  <Button
                    onClick={() => onCreateNodeFromHighlight(highlight, 'event')}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
                  >
                    Create Node
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      );
    }