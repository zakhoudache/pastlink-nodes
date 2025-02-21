
import { Panel } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { NodeType } from '../HistoricalNode';
import {
  Calendar,
  User,
  Zap,
  BookText,
  CalendarDays,
  Landmark,
  BadgeDollarSign,
  Users,
  Palette,
} from 'lucide-react';

interface LeftPanelProps {
  onAddNode: (type: NodeType) => void;
}

export function LeftPanel({ onAddNode }: LeftPanelProps) {
  return (
    <Panel position="top-left" className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('event')}
          className="flex items-center gap-2"
        >
          <Calendar size={16} />
          إضافة حدث
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('person')}
          className="flex items-center gap-2"
        >
          <User size={16} />
          إضافة شخصية
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('cause')}
          className="flex items-center gap-2"
        >
          <Zap size={16} />
          إضافة سبب
        </Button>
      </div>

      <div className="h-px bg-border my-2" />
      
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('political')}
          className="flex items-center gap-2"
        >
          <Landmark size={16} />
          عامل سياسي
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('economic')}
          className="flex items-center gap-2"
        >
          <BadgeDollarSign size={16} />
          عامل اقتصادي
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('social')}
          className="flex items-center gap-2"
        >
          <Users size={16} />
          عامل اجتماعي
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('cultural')}
          className="flex items-center gap-2"
        >
          <Palette size={16} />
          عامل ثقافي
        </Button>
      </div>
    </Panel>
  );
}
