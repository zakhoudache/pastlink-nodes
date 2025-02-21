
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
  BookOpen,
  Clock,
  Target,
  BarChart2,
  Globe,
  HelpCircle,
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('term')}
          className="flex items-center gap-2"
        >
          <BookOpen size={16} />
          إضافة مصطلح
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('date')}
          className="flex items-center gap-2"
        >
          <Clock size={16} />
          إضافة تاريخ
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('goal')}
          className="flex items-center gap-2"
        >
          <Target size={16} />
          إضافة هدف
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('indicator')}
          className="flex items-center gap-2"
        >
          <BarChart2 size={16} />
          إضافة مؤشر
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('country')}
          className="flex items-center gap-2"
        >
          <Globe size={16} />
          إضافة دولة
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNode('other')}
          className="flex items-center gap-2"
        >
          <HelpCircle size={16} />
          نوع آخر
        </Button>
      </div>
    </Panel>
  );
}
