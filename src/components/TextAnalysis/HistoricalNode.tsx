
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface HistoricalNodeProps {
  data: {
    label: string;
    type: string;
    description?: string;
  };
}

const HistoricalNode = memo(({ data }: HistoricalNodeProps) => {
  // Map node types to colors and styles
  const nodeTypeStyles = {
    event: {
      background: 'bg-purple-100',
      border: 'border-purple-500',
      text: 'text-purple-900'
    },
    person: {
      background: 'bg-blue-100',
      border: 'border-blue-500',
      text: 'text-blue-900'
    },
    cause: {
      background: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-900'
    },
    political: {
      background: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-900'
    },
    economic: {
      background: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-900'
    },
    social: {
      background: 'bg-orange-100',
      border: 'border-orange-500',
      text: 'text-orange-900'
    },
    cultural: {
      background: 'bg-pink-100',
      border: 'border-pink-500',
      text: 'text-pink-900'
    }
  }[data.type] || {
    background: 'bg-gray-100',
    border: 'border-gray-500',
    text: 'text-gray-900'
  };

  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 min-w-[150px] ${nodeTypeStyles.background} ${nodeTypeStyles.border}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400" />
      <div className="flex flex-col gap-1">
        <span className={`text-sm font-medium ${nodeTypeStyles.text}`}>{data.label}</span>
        <span className="text-xs font-medium text-gray-600">{data.type}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400" />
    </div>
  );
});

HistoricalNode.displayName = 'HistoricalNode';

export default HistoricalNode;
