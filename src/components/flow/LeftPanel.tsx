import React, { useState, useRef } from 'react';
import { NodeType } from '../HistoricalNode';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
export interface LeftPanelProps {
  onFitView: () => void;
  onDownloadPDF: () => void;
  onAddNode: (type: NodeType) => void;
  onAnalyzeText: (text: string) => Promise<void>;
  onAutoLayout: () => void;
  distributeNodesEvenly: () => void;
  additionalButtons?: {
    label: string;
    onClick: () => void;
  }[];
}
export const LeftPanel: React.FC<LeftPanelProps> = ({
  onFitView,
  onDownloadPDF,
  onAddNode,
  onAnalyzeText,
  onAutoLayout,
  distributeNodesEvenly,
  additionalButtons
}) => {
  const [text, setText] = useState('');
  const [width, setWidth] = useState(250);
  const [height, setHeight] = useState(400);
  const [position, setPosition] = useState({
    x: 10,
    y: 10
  });

  // Create a ref to attach to the draggable element
  const dragRef = useRef<HTMLDivElement>(null);
  const handleAnalyze = () => {
    if (text.trim()) {
      onAnalyzeText(text);
      setText('');
    }
  };
  const handleResize = (e: any, direction: any, ref: any, d: any) => {
    setWidth(prevWidth => prevWidth + d.width);
    setHeight(prevHeight => prevHeight + d.height);
  };
  const handleDragStop = (e: any, data: any) => {
    setPosition({
      x: data.x,
      y: data.y
    });
  };
  return <Draggable nodeRef={dragRef} handle=".drag-handle" defaultPosition={{
    x: position.x,
    y: position.y
  }} onStop={handleDragStop}>
      <div ref={dragRef} style={{
      position: 'absolute',
      zIndex: 1000
    }} className="py-0 my-0">
        <div className="drag-handle bg-gray-100 px-3 py-2 text-sm font-medium border-b border-gray-200 cursor-move">
          Drag Me
        </div>
        <Resizable size={{
        width,
        height
      }} minWidth={200} minHeight={300} maxWidth={400} maxHeight={600} onResize={handleResize} onResizeStop={handleResize} enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false
      }}>
          <div style={{
          width: '100%',
          height: '100%'
        }} className="rounded-lg bg-white p-4 shadow-lg py-[17px]">
            <div className="mb-4 space-y-2">
              <Button onClick={onFitView} variant="outline" className="w-full">
                Fit View
              </Button>
              <Button onClick={onDownloadPDF} variant="outline" className="w-full">
                Download PDF
              </Button>
            </div>

            <div className="mb-4 space-y-2">
              <Button onClick={onAutoLayout} variant="outline" className="w-full">
                Auto Layout (Dagre)
              </Button>
              <Button onClick={distributeNodesEvenly} variant="outline" className="w-full">
                Distribute Evenly
              </Button>
              {additionalButtons && additionalButtons.map((button, index) => <Button key={index} onClick={button.onClick} variant="outline" className="w-full">
                    {button.label}
                  </Button>)}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Add New Node</h3>
              <div className="grid grid-cols-2 gap-1">
                <Button onClick={() => onAddNode('event')} variant="outline" size="sm">
                  Event 📅
                </Button>
                <Button onClick={() => onAddNode('person')} variant="outline" size="sm">
                  Person 👤
                </Button>
                <Button onClick={() => onAddNode('cause')} variant="outline" size="sm">
                  Cause ⚡
                </Button>
                <Button onClick={() => onAddNode('political')} variant="outline" size="sm">
                  Political 🏛️
                </Button>
                <Button onClick={() => onAddNode('economic')} variant="outline" size="sm">
                  Economic 💰
                </Button>
                <Button onClick={() => onAddNode('social')} variant="outline" size="sm">
                  Social 👥
                </Button>
                <Button onClick={() => onAddNode('cultural')} variant="outline" size="sm">
                  Cultural 🎭
                </Button>
                <Button onClick={() => onAddNode('term')} variant="outline" size="sm">
                  Term 📖
                </Button>
                <Button onClick={() => onAddNode('date')} variant="outline" size="sm">
                  Date ⏰
                </Button>
                <Button onClick={() => onAddNode('goal')} variant="outline" size="sm">
                  Goal 🎯
                </Button>
                <Button onClick={() => onAddNode('indicator')} variant="outline" size="sm">
                  Indicator 📊
                </Button>
                <Button onClick={() => onAddNode('country')} variant="outline" size="sm">
                  Country 🌍
                </Button>
                <Button onClick={() => onAddNode('other')} variant="outline" size="sm">
                  Other ❔
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Analyze Text</h3>
              <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Enter text here for analysis..." className="mb-2" dir="rtl" />
              <Button onClick={handleAnalyze} className="w-full" disabled={!text.trim()}>
                Analyze
              </Button>
            </div>
          </div>
        </Resizable>
      </div>
    </Draggable>;
};