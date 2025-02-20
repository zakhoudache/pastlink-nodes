
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
  const nodeTypeColor = {
    event: 'bg-node-event',
    person: 'bg-node-person',
    cause: 'bg-node-cause',
    political: 'bg-node-political',
    economic: 'bg-node-economic',
    social: 'bg-node-social',
    cultural: 'bg-node-cultural',
  }[data.type] || 'bg-gray-100';

  return (
    <div className={`px-4 py-2 rounded-lg shadow-lg ${nodeTypeColor} transition-all duration-200`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400" />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-800">{data.label}</span>
        {data.description && (
          <span className="text-xs text-gray-600">{data.description}</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400" />
    </div>
  );
});

HistoricalNode.displayName = 'HistoricalNode';

export default HistoricalNode;
