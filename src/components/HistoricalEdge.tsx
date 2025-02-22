import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export interface HistoricalEdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  customLabel?: string;
  animated?: boolean;
  selected?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  data?: Record<string, unknown>;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties; // Add label style
}

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
}: EdgeProps<HistoricalEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data;
  const edgeLabel = edgeData?.customLabel || edgeData?.type || 'connected';
  const labelStyle = edgeData?.labelStyle || {}; // Use label style

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="px-2 py-1 bg-white rounded shadow-sm border text-sm" style={labelStyle}> {/* Apply label style */}
            {edgeLabel}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}