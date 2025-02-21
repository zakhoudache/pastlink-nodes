import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { Button } from '@/components/ui/button';

interface EdgeData {
  type: string;
  customLabel?: string;
}

const relationshipColors: Record<string, { stroke: string; background: string }> = {
  'caused-by': { stroke: '#ef4444', background: '#fee2e2' },
  'led-to': { stroke: '#3b82f6', background: '#dbeafe' },
  'influenced': { stroke: '#8b5cf6', background: '#ede9fe' },
  'part-of': { stroke: '#10b981', background: '#d1fae5' },
  'opposed-to': { stroke: '#f59e0b', background: '#fef3c7' },
  'related-to': { stroke: '#64748b', background: '#f1f5f9' },
};

export function HistoricalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
  onEdgeClick,
}: EdgeProps<EdgeData>) {

  const colors = relationshipColors[data?.type || 'related-to'];
  const label = data?.customLabel || data?.type?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });


  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: colors.stroke,
          strokeWidth: selected ? 3 : 2,
          transition: 'stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        <Button
          className="nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs"
          variant="outline"
          style={{
            left: labelX,
            top: labelY,
            backgroundColor: colors.background,
            borderColor: colors.stroke,
            color: colors.stroke,
            fontWeight: 500,
          }}
          onClick={(event) => onEdgeClick?.(event, id)}
        >
          {label}
        </Button>
      </EdgeLabelRenderer>
    </>
  );
}