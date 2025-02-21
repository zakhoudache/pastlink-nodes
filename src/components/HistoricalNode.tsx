
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';

export type NodeType = 'event' | 'person' | 'cause' | 'political' | 'economic' | 'social' | 'cultural';

export interface HistoricalNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  description?: string;
}

interface Props {
  data: HistoricalNodeData;
  isConnectable: boolean;
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

export default function HistoricalNode({ data, isConnectable }: Props) {
  if (!data) {
    return <div>خطأ: لم يتم توفير البيانات</div>;
  }

  const { type, label, description } = data;
  const colors = typeColors[type] || { bg: 'bg-gray-50', border: 'border-gray-200' };

  return (
    <Card className={`w-60 shadow-sm ${colors.bg} ${colors.border} border-2`} dir="rtl">
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
  );
}
