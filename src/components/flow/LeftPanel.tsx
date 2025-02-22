// LeftPanel.tsx
import React from 'react';

interface LeftPanelProps {
  onFitView: () => void;
  onDownloadPDF: () => void;
  onAddNode: (type: string) => void;
  onAnalyzeText: (text: string) => Promise<void>;
  onAutoLayout: () => void;
  distributeNodesEvenly: () => void;  // New prop
  additionalButtons?: { label: string; onClick: () => void }[]; //New prop
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  onFitView,
  onDownloadPDF,
  onAddNode,
  onAnalyzeText,
  onAutoLayout,
  distributeNodesEvenly, // Destructure the new prop
  additionalButtons,
}) => {
  const [textToAnalyze, setTextToAnalyze] = React.useState('');

  return (
    <aside className="w-64 bg-gray-100 p-4 space-y-4">
      <h2 className="text-lg font-semibold">Actions</h2>
      <button onClick={onFitView} className="block w-full p-2 bg-blue-500 text-white rounded">
        Fit View
      </button>
      <button onClick={onDownloadPDF} className="block w-full p-2 bg-blue-500 text-white rounded">
        Download as PDF
      </button>
      <button onClick={() => onAddNode('event')} className="block w-full p-2 bg-green-500 text-white rounded">
        Add Event
      </button>
      <button onClick={onAutoLayout} className="block w-full p-2 bg-purple-500 text-white rounded">
        Auto Layout (Dagre)
      </button>
      <button onClick={distributeNodesEvenly} className="block w-full p-2 bg-orange-500 text-white rounded">
        Distribute Evenly
      </button>
      {additionalButtons && additionalButtons.map((button, index) => (
          <button key={index} onClick={button.onClick} className="block w-full p-2 bg-gray-700 text-white rounded">
            {button.label}
          </button>
        ))}

      <div>
        <label htmlFor="analyzeText" className="block text-sm font-medium text-gray-700">
          Analyze Text:
        </label>
        <textarea
          id="analyzeText"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={4}
          value={textToAnalyze}
          onChange={(e) => setTextToAnalyze(e.target.value)}
        ></textarea>
        <button
          onClick={() => onAnalyzeText(textToAnalyze)}
          className="mt-2 block w-full p-2 bg-indigo-500 text-white rounded"
        >
          Analyze
        </button>
      </div>
    </aside>
  );
};