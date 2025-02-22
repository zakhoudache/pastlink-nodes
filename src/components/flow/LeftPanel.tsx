// src/components/flow/LeftPanel.tsx
import React, { useState } from 'react';
import { NodeType } from '../HistoricalNode';
import { Button } from '@/components/ui/button';  // Adjust path as necessary
import { Textarea } from '@/components/ui/textarea'; // Adjust path as necessary

export interface LeftPanelProps {
    onFitView: () => void;
    onDownloadPDF: () => void;
    onAddNode: (type: NodeType) => void;
    onAnalyzeText: (text: string) => Promise<void>;
    onAutoLayout: () => void;
    distributeNodesEvenly: () => void;
    additionalButtons?: { label: string; onClick: () => void }[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
    onFitView,
    onDownloadPDF,
    onAddNode,
    onAnalyzeText,
    onAutoLayout,
    distributeNodesEvenly,
    additionalButtons,
}) => {
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
                    {additionalButtons && additionalButtons.map((button, index) => (
                        <Button key={index} onClick={button.onClick} variant="outline" className="w-full">
                            {button.label}
                        </Button>
                    ))}
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
            </div>

            <div className="rounded-lg bg-white p-4 shadow-lg">
                <h3 className="mb-2 font-medium">Analyze Text</h3>
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text here for analysis..."
                    className="mb-2"
                    dir="rtl"
                />
                <Button onClick={handleAnalyze} className="w-full" disabled={!text.trim()}>
                    Analyze
                </Button>
            </div>
        </div>
    );
};