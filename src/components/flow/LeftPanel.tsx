
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
  const groupStyles = {
    basic: {
      background: 'bg-blue-50',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100',
    },
    info: {
      background: 'bg-purple-50',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-100',
    },
    goals: {
      background: 'bg-emerald-50',
      border: 'border-emerald-200',
      hover: 'hover:bg-emerald-100',
    },
    factors: {
      background: 'bg-amber-50',
      border: 'border-amber-200',
      hover: 'hover:bg-amber-100',
    },
    other: {
      background: 'bg-gray-50',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-100',
    },
  };

  return (
    <Panel position="top-left" className="flex flex-col gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border max-h-[90vh] overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">العناصر الأساسية</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('event')}
              className={`flex items-center gap-2 ${groupStyles.basic.background} ${groupStyles.basic.border} ${groupStyles.basic.hover}`}
            >
              <Calendar size={16} />
              حدث
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('person')}
              className={`flex items-center gap-2 ${groupStyles.basic.background} ${groupStyles.basic.border} ${groupStyles.basic.hover}`}
            >
              <User size={16} />
              شخصية
            </Button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <h3 className="text-sm font-medium mb-2">المعلومات</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('term')}
              className={`flex items-center gap-2 ${groupStyles.info.background} ${groupStyles.info.border} ${groupStyles.info.hover}`}
            >
              <BookOpen size={16} />
              مصطلح
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('date')}
              className={`flex items-center gap-2 ${groupStyles.info.background} ${groupStyles.info.border} ${groupStyles.info.hover}`}
            >
              <Clock size={16} />
              تاريخ
            </Button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <h3 className="text-sm font-medium mb-2">الأهداف والمؤشرات</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('goal')}
              className={`flex items-center gap-2 ${groupStyles.goals.background} ${groupStyles.goals.border} ${groupStyles.goals.hover}`}
            >
              <Target size={16} />
              هدف
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('indicator')}
              className={`flex items-center gap-2 ${groupStyles.goals.background} ${groupStyles.goals.border} ${groupStyles.goals.hover}`}
            >
              <BarChart2 size={16} />
              مؤشر
            </Button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <h3 className="text-sm font-medium mb-2">العوامل</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('political')}
              className={`flex items-center gap-2 ${groupStyles.factors.background} ${groupStyles.factors.border} ${groupStyles.factors.hover}`}
            >
              <Landmark size={16} />
              سياسي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('economic')}
              className={`flex items-center gap-2 ${groupStyles.factors.background} ${groupStyles.factors.border} ${groupStyles.factors.hover}`}
            >
              <BadgeDollarSign size={16} />
              اقتصادي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('social')}
              className={`flex items-center gap-2 ${groupStyles.factors.background} ${groupStyles.factors.border} ${groupStyles.factors.hover}`}
            >
              <Users size={16} />
              اجتماعي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('cultural')}
              className={`flex items-center gap-2 ${groupStyles.factors.background} ${groupStyles.factors.border} ${groupStyles.factors.hover}`}
            >
              <Palette size={16} />
              ثقافي
            </Button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <h3 className="text-sm font-medium mb-2">أخرى</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('country')}
              className={`flex items-center gap-2 ${groupStyles.other.background} ${groupStyles.other.border} ${groupStyles.other.hover}`}
            >
              <Globe size={16} />
              دولة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('other')}
              className={`flex items-center gap-2 ${groupStyles.other.background} ${groupStyles.other.border} ${groupStyles.other.hover}`}
            >
              <HelpCircle size={16} />
              آخر
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
