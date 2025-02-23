
import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export interface HistoricalNodeData {
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

const typeStyles: Record<NodeType, { bg: string; border: string; shadow: string }> = {
  event: { bg: 'bg-blue-50', border: 'border-blue-200', shadow: 'shadow-blue-100' },
  person: { bg: 'bg-green-50', border: 'border-green-200', shadow: 'shadow-green-100' },
  cause: { bg: 'bg-red-50', border: 'border-red-200', shadow: 'shadow-red-100' },
  political: { bg: 'bg-purple-50', border: 'border-purple-200', shadow: 'shadow-purple-100' },
  economic: { bg: 'bg-yellow-50', border: 'border-yellow-200', shadow: 'shadow-yellow-100' },
  social: { bg: 'bg-pink-50', border: 'border-pink-200', shadow: 'shadow-pink-100' },
  cultural: { bg: 'bg-indigo-50', border: 'border-indigo-200', shadow: 'shadow-indigo-100' },
  term: { bg: 'bg-slate-50', border: 'border-slate-200', shadow: 'shadow-slate-100' },
  date: { bg: 'bg-orange-50', border: 'border-orange-200', shadow: 'shadow-orange-100' },
  goal: { bg: 'bg-emerald-50', border: 'border-emerald-200', shadow: 'shadow-emerald-100' },
  indicator: { bg: 'bg-cyan-50', border: 'border-cyan-200', shadow: 'shadow-cyan-100' },
  country: { bg: 'bg-teal-50', border: 'border-teal-200', shadow: 'shadow-teal-100' },
  other: { bg: 'bg-gray-50', border: 'border-gray-200', shadow: 'shadow-gray-100' },
};

export default function HistoricalNode({ data, isConnectable, id, selected }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<HistoricalNodeData>(data);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 100 });

  useEffect(() => {
    if (nodeRef.current) {
      const content = nodeRef.current.querySelector('.node-content');
      if (content) {
        const width = Math.max(200, content.scrollWidth + 32);
        const height = Math.max(100, content.scrollHeight + 32);
        setDimensions({ width, height });
      }
    }
  }, [data]);

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

  if (!data) return null;

  const { type, label, description } = data;
  const styles = typeStyles[type];

  return (
    <div
      ref={nodeRef}
      className={`${styles.bg} ${styles.border} ${styles.shadow} border-2 rounded-lg ${
        selected ? 'ring-2 ring-blue-500' : ''
      } p-4`}
      style={{ width: dimensions.width, height: dimensions.height }}
      onDoubleClick={handleDoubleClick}
      dir="rtl"
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-muted-foreground"
      />
      
      <div className="node-content">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" role="img" aria-label={typeLabels[type]}>
            {typeIcons[type]}
          </span>
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              {typeLabels[type]}
            </div>
            <div className="font-semibold text-lg">{label}</div>
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-muted-foreground"
      />

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
            <div>
              <label className="text-sm font-medium">النوع</label>
              <Select 
                onValueChange={(value) => setEditedData((prev) => ({ ...prev, type: value as NodeType }))} 
                defaultValue={editedData.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
