import { NodeType } from '../HistoricalNode';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

export interface LeftPanelProps {
  onFitView: () => void;
  onDownloadPDF: () => void;
  onAddNode: (type: NodeType) => void;
  onAnalyzeText: (text: string) => Promise<void>;
}

export function LeftPanel({ onFitView, onDownloadPDF, onAddNode, onAnalyzeText }: LeftPanelProps) {
  const [text, setText] = useState('');

  const handleAnalyze = () => {
    if (text.trim()) {
      onAnalyzeText(text);
      setText('');
    }
  };

  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col gap-2">
      <div className="rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-4 space-y-2">
          <Button onClick={onFitView} variant="outline" className="w-full">
            تركيز العرض
          </Button>
          <Button onClick={onDownloadPDF} variant="outline" className="w-full">
            تحميل PDF
          </Button>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">إضافة عنصر جديد</h3>
          <div className="grid grid-cols-2 gap-1">
            <Button onClick={() => onAddNode('event')} variant="outline" size="sm">
              حدث 📅
            </Button>
            <Button onClick={() => onAddNode('person')} variant="outline" size="sm">
              شخصية 👤
            </Button>
            <Button onClick={() => onAddNode('cause')} variant="outline" size="sm">
              سبب ⚡
            </Button>
            <Button onClick={() => onAddNode('political')} variant="outline" size="sm">
              سياسي 🏛️
            </Button>
            <Button onClick={() => onAddNode('economic')} variant="outline" size="sm">
              اقتصادي 💰
            </Button>
            <Button onClick={() => onAddNode('social')} variant="outline" size="sm">
              اجتماعي 👥
            </Button>
            <Button onClick={() => onAddNode('cultural')} variant="outline" size="sm">
              ثقافي 🎭
            </Button>
            <Button onClick={() => onAddNode('term')} variant="outline" size="sm">
              مصطلح 📖
            </Button>
            <Button onClick={() => onAddNode('date')} variant="outline" size="sm">
              تاريخ ⏰
            </Button>
            <Button onClick={() => onAddNode('goal')} variant="outline" size="sm">
              هدف 🎯
            </Button>
            <Button onClick={() => onAddNode('indicator')} variant="outline" size="sm">
              مؤشر 📊
            </Button>
            <Button onClick={() => onAddNode('country')} variant="outline" size="sm">
              دولة 🌍
            </Button>
            <Button onClick={() => onAddNode('other')} variant="outline" size="sm">
              آخر ❔
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-lg">
        <h3 className="mb-2 font-medium">تحليل النص</h3>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="أدخل النص هنا للتحليل..."
          className="mb-2"
          dir="rtl"
        />
        <Button onClick={handleAnalyze} className="w-full" disabled={!text.trim()}>
          تحليل
        </Button>
      </div>
    </div>
  );
}
