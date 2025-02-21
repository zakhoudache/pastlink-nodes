
import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import Analysis from './Analysis';
import Flow from './Flow';

export default function HomePage() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 h-screen">
      <div className="h-full overflow-auto rounded-lg shadow-lg border bg-white/80">
        <div className="p-4">
          <Analysis />
        </div>
      </div>
      <div className="h-full overflow-hidden rounded-lg shadow-lg border bg-white/80">
        <Flow />
      </div>
    </div>
  );
}
