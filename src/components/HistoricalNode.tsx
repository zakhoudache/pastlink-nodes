'use client';

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
  const nodeRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [cardWidth, setCardWidth] = useState(160);
  const [cardHeight, setCardHeight] = useState(200);
  const prevOpen = useRef(false);

  useEffect(() => {
    if (!prevOpen.current && isDialogOpen) {
      setEditedData(data);
    }
    prevOpen.current = isDialogOpen;
  }, [isDialogOpen, data]);

  useEffect(() => {
    if (nodeRef.current) {
      // Auto-adjust node size based on content
      const contentHeight = nodeRef.current.scrollHeight;
      const contentWidth = nodeRef.current.scrollWidth;
      nodeRef.current.style.width = `${Math.max(200, contentWidth + 32)}px`;
      nodeRef.current.style.height = `${Math.max(100, contentHeight + 32)}px`;
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

  const handleHorizontalResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = cardWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(400, Math.max(120, startWidth + e.clientX - startX));
      setCardWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [cardWidth]);

  const handleVerticalResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = cardHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = Math.min(500, Math.max(120, startHeight + e.clientY - startY));
      setCardHeight(newHeight);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [cardHeight]);

  if (!data) {
    return <div>خطأ: لم يتم توفير البيانات</div>;
  }

  const { type, label, description } = data;
  const colors = typeColors[type] || { bg: 'bg-gray-50', border: 'border-gray-200' };

  return (
    <>
      <div className="relative inline-block">
        <Card
          className={`shadow-md ${colors.bg} ${colors.border} border-2 rounded-lg ${
            selected ? 'ring-2 ring-blue-500' : ''
          } transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2`}
          dir="rtl"
          onDoubleClick={handleDoubleClick}
          tabIndex={0}
          style={{ 
            width: cardWidth, 
            height: cardHeight,
            overflow: 'auto'
          }}
        >
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="!bg-muted-foreground"
          />
          <div className="p-4 relative">
            <button
              onClick={() => setShowControls((prev) => !prev)}
              className="absolute top-1 right-1 p-1 bg-white rounded-full shadow hover:bg-gray-100 z-20"
              aria-label="More controls"
            >
              ⋮
            </button>
            {showControls && (
              <div className="absolute top-8 right-1 bg-white border border-gray-200 shadow-lg rounded-md z-30">
                <button
                  onClick={() => {
                    setIsDialogOpen(true);
                    setShowControls(false);
                  }}
                  className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
                >
                  تحرير
                </button>
                <button
                  onClick={() => {
                    console.log('Deleting node', id);
                    setShowControls(false);
                  }}
                  className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
                >
                  حذف
                </button>
              </div>
            )}
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
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="!bg-muted-foreground"
          />
        </Card>
        <div
          onMouseDown={handleHorizontalResize}
          className="absolute right-[-5px] top-1/2 transform -translate-y-1/2 w-2 h-12 cursor-ew-resize 
            bg-gray-400 hover:bg-blue-500 rounded-full shadow-md transition-colors duration-200 opacity-70 
            hover:opacity-100"
        />
        <div
          onMouseDown={handleVerticalResize}
          className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-12 h-2 cursor-ns-resize 
            bg-gray-400 hover:bg-blue-500 rounded-full shadow-md transition-colors duration-200 opacity-70 
            hover:opacity-100"
        />
      </div>

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
              <label className="text-sm font-medium">Type</label>
              <Select onValueChange={(value) => setEditedData((prev) => ({ ...prev, type: value as NodeType }))} defaultValue={editedData.type}>
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
    </>
  );
}
