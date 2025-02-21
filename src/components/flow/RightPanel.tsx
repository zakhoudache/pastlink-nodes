
import { Panel } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RightPanelProps {
  onExportPdf: () => void;
}

export function RightPanel({ onExportPdf }: RightPanelProps) {
  const { getNodes, getEdges } = useReactFlow();

  const handleExport = async () => {
    try {
      const nodes = getNodes();
      const edges = getEdges();

      const { data, error } = await supabase.functions.invoke('export-flow', {
        body: { nodes, edges }
      });

      if (error) throw error;

      // Create a blob from the PDF buffer
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'flow-diagram.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('تم تصدير PDF بنجاح!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('فشل تصدير PDF');
    }
  };

  return (
    <Panel position="top-right" className="flex flex-col gap-2 p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
      >
        <Download size={16} />
        تصدير PDF
      </Button>
    </Panel>
  );
}
