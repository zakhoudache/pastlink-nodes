
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
import { ColorPicker } from '../ColorPicker';
import { useState } from 'react';

interface LeftPanelProps {
  onAddNode: (type: NodeType) => void;
}

export function LeftPanel({ onAddNode }: LeftPanelProps) {
  const [buttonColor, setButtonColor] = useState('#8E9196');

  return (
    <Panel position="top-left" className="flex flex-col gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border max-h-[90vh] overflow-y-auto">
      <div className="space-y-2">
        <h3 className="text-sm font-medium mb-2">لون الأزرار</h3>
        <ColorPicker value={buttonColor} onChange={setButtonColor} />
      </div>

      <div className="h-px bg-border" />
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">العناصر الأساسية</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('event')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Calendar size={16} />
              حدث
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('person')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <User size={16} />
              شخصية
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">المعلومات</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('term')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <BookOpen size={16} />
              مصطلح
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('date')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Clock size={16} />
              تاريخ
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">الأهداف والمؤشرات</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('goal')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Target size={16} />
              هدف
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('indicator')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <BarChart2 size={16} />
              مؤشر
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">العوامل</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('political')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Landmark size={16} />
              سياسي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('economic')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <BadgeDollarSign size={16} />
              اقتصادي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('social')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Users size={16} />
              اجتماعي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('cultural')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Palette size={16} />
              ثقافي
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">أخرى</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('country')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
            >
              <Globe size={16} />
              دولة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNode('other')}
              className="flex items-center gap-2"
              style={{ borderColor: buttonColor }}
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
