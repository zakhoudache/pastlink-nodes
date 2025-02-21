'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Define possible node types
export type NodeType = 'event' | 'person' | 'cause' | 'political' | 'economic' | 'social' | 'cultural';

// Interface for node data
export interface HistoricalNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  description?: string;
}

// Props interface for the component
interface Props {
  data: HistoricalNodeData;
  isConnectable: boolean;
  id: string;
  selected: boolean;
}

// Icons for each node type
const typeIcons: Record<NodeType, string> = {
  event: '📅',
  person: '👤',
  cause: '⚡',
  political: '🏛️',
  economic: '💰',
  social: '👥',
  cultural: '🎭',
};

// Labels for each node type (in Arabic)
const typeLabels: Record<NodeType, string> = {
  event: 'حدث',
  person: 'شخصية',
  cause: 'سبب',
  political: 'سياسي',
  economic: 'اقتصادي',
  social: 'اجتماعي',
  cultural: 'ثقافي',
};

// Colors for each node type
const typeColors: Record<NodeType, { bg: string; border: string }> = {
  event: { bg: 'bg-blue-50', border: 'border-blue-200' },
  person: { bg: 'bg-green-50', border: 'border-green-200' },
  cause: { bg: 'bg-red-50', border: 'border-red-200' },
  political: { bg: 'bg-purple-50', border: 'border-purple-200' },
  economic: { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  social: { bg: 'bg-pink-50', border: 'border-pink-200' },
  cultural: { bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

// HistoricalNode component
export default function HistoricalNode({ data, isConnectable, id, selected }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<HistoricalNodeData>(data);
  const prevOpen = useRef(false);

  // Reset editedData when the dialog opens
  useEffect(() => {
    if (!prevOpen.current && isDialogOpen) {
      setEditedData(data);
    }
    prevOpen.current = isDialogOpen;
  }, [isDialogOpen, data]);

  // Handle double-click to open the dialog
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDialogOpen(true);
  }, []);

  // Handle saving edited data
  const handleSave = useCallback(() => {
    const event = new CustomEvent('updateNodeData', {
      detail: { id, data: editedData },
    });
    window.dispatchEvent(event);
    setIsDialogOpen(false);
  }, [id, editedData]);

  // Check if data is provided
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
              <div className="text-xs font-medium text-muted-foreground">{typeLabels[type]}</div>
              <div className="font-medium">{label}</div>
            </div>
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
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
                onChange={(e) => setEditedData((prev) => ({ ...prev, label: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف</label>
              <Textarea
                value={editedData.description || ''}
                onChange={(e) => setEditedData((prev) => ({ ...prev, description: e.target.value }))}
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
