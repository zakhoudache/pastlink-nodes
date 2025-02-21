
import { useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type NodeType = 'event' | 'person' | 'cause' | 'political' | 'economic' | 'social' | 'cultural';

export interface HistoricalNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  description?: string;
}

interface Props {
  data: HistoricalNodeData;
  isConnectable: boolean;
  id: string;
  selected: boolean;
}

const typeIcons: Record<NodeType, string> = {
  event: '📅',
  person: '👤',
  cause: '⚡',
  political: '🏛️',
  economic: '💰',
  social: '👥',
  cultural: '🎭',
};

const typeLabels: Record<NodeType, string> = {
  event: 'حدث',
  person: 'شخصية',
  cause: 'سبب',
  political: 'سياسي',
  economic: 'اقتصادي',
  social: 'اجتماعي',
  cultural: 'ثقافي',
};

const typeColors: Record<NodeType, { bg: string; border: string }> = {
  event: { bg: 'bg-blue-50', border: 'border-blue-200' },
  person: { bg: 'bg-green-50', border: 'border-green-200' },
  cause: { bg: 'bg-red-50', border: 'border-red-200' },
  political: { bg: 'bg-purple-50', border: 'border-purple-200' },
  economic: { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  social: { bg: 'bg-pink-50', border: 'border-pink-200' },
  cultural: { bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

export default function HistoricalNode({ data, isConnectable, id, selected }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    // Dispatch event to update node data
    const event = new CustomEvent('updateNodeData', {
      detail: { id, data: editedData }
    });
    window.dispatchEvent(event);
    setIsDialogOpen(false);
  }, [id, editedData]);

  if (!data) {
    return <div>خطأ: لم يتم توفير البيانات</div>;
  }

  const { type, label, description } = data;
  const colors = typeColors[type] || { bg: 'bg-gray-50', border: 'border-gray-200' };

  return (
    <>
      <Card 
        className={`w-60 shadow-sm ${colors.bg} ${colors.border} border-2 ${selected ? 'ring-2 ring-blue-500' : ''}`} 
        dir="rtl"
        onDoubleClick={handleDoubleClick}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!bg-muted-foreground"
        />
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl" role="img" aria-label={typeLabels[type]}>
              {typeIcons[type]}
            </span>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {typeLabels[type]}
              </div>
              <div className="font-medium">{label}</div>
            </div>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!bg-muted-foreground"
        />
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحرير العنصر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">العنوان</label>
              <Input
                value={editedData.label}
                onChange={(e) => setEditedData(prev => ({ ...prev, label: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف</label>
              <Textarea
                value={editedData.description || ''}
                onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSave}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
