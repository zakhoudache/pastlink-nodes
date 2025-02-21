
import { Panel } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface RightPanelProps {
  onExportPdf: () => void;
}

export function RightPanel({ onExportPdf }: RightPanelProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-2 p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPdf}
        className="flex items-center gap-2"
      >
        <Download size={16} />
        تصدير PDF
      </Button>
    </Panel>
  );
}
