
import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import Analysis from './Analysis';
import Flow from './Flow';

export default function HomePage() {
  return (
    <div dir="rtl" className="grid grid-cols-2 gap-4 p-4">
      <div>
        <Analysis />
      </div>
      <div>
        <Flow />
      </div>
    </div>
  );
}
