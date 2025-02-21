
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Panel } from '@xyflow/react';
import { NodeType } from '../HistoricalNode';

interface Highlight {
  id: string;
  text: string;
}

interface RightPanelProps {
  highlights: Highlight[];
  onCreateNodeFromHighlight: (highlight: Highlight, type: NodeType) => void;
}

export function RightPanel({ highlights, onCreateNodeFromHighlight }: RightPanelProps) {
  return (
    <Panel position="top-right" className="bg-background/50 backdrop-blur-sm p-4 rounded-lg w-80">
      <div className="space-y-4">
        <h3 className="font-semibold">Highlighted Passages</h3>
        {highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No highlights available. Select text in the Analysis page to create nodes.
          </p>
        ) : (
          <div className="space-y-3">
            {highlights.map((highlight) => (
              <Card key={highlight.id} className="p-3">
                <p className="text-sm mb-2">{highlight.text}</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'event')}
                    >
                      Event
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 hover:bg-green-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'person')}
                    >
                      Person
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'cause')}
                    >
                      Cause
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-purple-50 hover:bg-purple-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'political')}
                    >
                      Political
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-yellow-50 hover:bg-yellow-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'economic')}
                    >
                      Economic
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-pink-50 hover:bg-pink-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'social')}
                    >
                      Social
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-indigo-50 hover:bg-indigo-100"
                      onClick={() => onCreateNodeFromHighlight(highlight, 'cultural')}
                    >
                      Cultural
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
