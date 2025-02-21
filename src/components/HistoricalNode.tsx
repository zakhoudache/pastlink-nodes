'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type NodeType = 
  | 'event' 
  | 'person' 
  | 'cause' 
  | 'political' 
  | 'economic' 
  | 'social' 
  | 'cultural'
  | 'term'
  | 'date'
  | 'goal'
  | 'indicator'
  | 'country'
  | 'other';

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
  term: '📖',
  date: '⏰',
  goal: '🎯',
  indicator: '📊',
  country: '🌍',
  other: '❔',
};

const typeLabels: Record<NodeType, string> = {
  event: 'حدث',
  person: 'شخصية',
  cause: 'سبب',
  political: 'سياسي',
  economic: 'اقتصادي',
  social: 'اجتماعي',
  cultural: 'ثقافي',
  term: 'مصطلح',
  date: 'تاريخ',
  goal: 'هدف',
  indicator: 'مؤشر',
  country: 'دولة',
  other: 'آخر',
};

const typeColors: Record<NodeType, { bg: string; border: string }> = {
  event: { bg: 'bg-blue-50', border: 'border-blue-200' },
  person: { bg: 'bg-green-50', border: 'border-green-200' },
  cause: { bg: 'bg-red-50', border: 'border-red-200' },
  political: { bg: 'bg-purple-50', border: 'border-purple-200' },
  economic: { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  social: { bg: 'bg-pink-50', border: 'border-pink-200' },
  cultural: { bg: 'bg-indigo-50', border: 'border-indigo-200' },
  term: { bg: 'bg-slate-50', border: 'border-slate-200' },
  date: { bg: 'bg-orange-50', border: 'border-orange-200' },
  goal: { bg: 'bg-emerald-50', border: 'border-emerald-200' },
  indicator: { bg: 'bg-cyan-50', border: 'border-cyan-200' },
  country: { bg: 'bg-teal-50', border: 'border-teal-200' },
  other: { bg: 'bg-gray-50', border: 'border-gray-200' },
};

export default function HistoricalNode({ data, isConnectable, id, selected }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<HistoricalNodeData>(data);
  const prevOpen = useRef(false);

  useEffect(() => {
    if (!prevOpen.current && isDialogOpen) {
      setEditedData(data);
    }
    prevOpen.current = isDialogOpen;
  }, [isDialogOpen, data]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const event = new CustomEvent('updateNodeData', {
      detail: { id, data: editedData },
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
