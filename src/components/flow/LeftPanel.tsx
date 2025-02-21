
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, ZoomIn } from 'lucide-react';
import { Panel } from '@xyflow/react';
import { NodeType } from '../HistoricalNode';

interface LeftPanelProps {
  onFitView: () => void;
  onDownloadPDF: () => void;
  onAddNode: (type: NodeType) => void;
}

export function LeftPanel({ onFitView, onDownloadPDF, onAddNode }: LeftPanelProps) {
  return (
    <>
      <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onFitView} className="flex items-center gap-2">
            <ZoomIn size={16} />
            Fit View
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadPDF} className="flex items-center gap-2">
            <Download size={16} />
            حفظ كـ PDF
          </Button>
        </div>
      </Panel>
      <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg">
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNode('event')}
            className="bg-blue-50 hover:bg-blue-100"
          >
            Add Event
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNode('person')}
            className="bg-green-50 hover:bg-green-100"
          >
            Add Person
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNode('cause')}
            className="bg-red-50 hover:bg-red-100"
          >
            Add Cause
          </Button>
          <Card className="p-2">
            <p className="text-xs font-medium mb-2">PESC Factors</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddNode('political')}
                className="bg-purple-50 hover:bg-purple-100"
              >
                Political
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddNode('economic')}
                className="bg-yellow-50 hover:bg-yellow-100"
              >
                Economic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddNode('social')}
                className="bg-pink-50 hover:bg-pink-100"
              >
                Social
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddNode('cultural')}
                className="bg-indigo-50 hover:bg-indigo-100"
              >
                Cultural
              </Button>
            </div>
          </Card>
        </div>
      </Panel>
    </>
  );
}
