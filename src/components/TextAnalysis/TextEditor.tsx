
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TextEditorProps {
  onCreateNode: (text: string, type: string) => void;
}

export default function TextEditor({ onCreateNode }: TextEditorProps) {
  const [text, setText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const { toast } = useToast();

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleCreateNode = (type: string) => {
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select some text to create a node",
        variant: "destructive",
      });
      return;
    }
    onCreateNode(selectedText, type);
    setSelectedText('');
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm animate-fade-in">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onMouseUp={handleTextSelection}
        placeholder="Enter your historical text here..."
        className="min-h-[200px] p-4 text-sm"
      />
      
      {selectedText && (
        <div className="flex flex-col gap-2 animate-slide-in">
          <p className="text-sm font-medium">Selected text: "{selectedText}"</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleCreateNode('event')} variant="outline" size="sm">
              Event
            </Button>
            <Button onClick={() => handleCreateNode('person')} variant="outline" size="sm">
              Person
            </Button>
            <Button onClick={() => handleCreateNode('cause')} variant="outline" size="sm">
              Cause
            </Button>
            <Button onClick={() => handleCreateNode('political')} variant="outline" size="sm">
              Political
            </Button>
            <Button onClick={() => handleCreateNode('economic')} variant="outline" size="sm">
              Economic
            </Button>
            <Button onClick={() => handleCreateNode('social')} variant="outline" size="sm">
              Social
            </Button>
            <Button onClick={() => handleCreateNode('cultural')} variant="outline" size="sm">
              Cultural
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
