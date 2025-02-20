
import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import TextEditor from '@/components/TextAnalysis/TextEditor';
import FlowCanvas from '@/components/TextAnalysis/FlowCanvas';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [summary, setSummary] = useState('');
  const [text, setText] = useState('');
  const { toast } = useToast();

  const createNode = useCallback((text: string, type: string, position?: { x: number, y: number }) => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: 'historical',
      data: { label: text, type },
      position: position || { 
        x: Math.random() * 500, 
        y: Math.random() * 300 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes]);

  const generateSummary = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { text },
      });

      if (error) throw error;
      
      setSummary(data.summary);

      // Clear existing nodes before adding new ones
      setNodes([]);
      setEdges([]);

      // Create nodes from relationships
      if (data.relationships && Array.isArray(data.relationships)) {
        data.relationships.forEach((rel: { text: string, type: string }, index: number) => {
          // Calculate position in a circular layout
          const angle = (2 * Math.PI * index) / data.relationships.length;
          const radius = 200;
          const x = 250 + radius * Math.cos(angle);
          const y = 150 + radius * Math.sin(angle);
          
          createNode(rel.text, rel.type, { x, y });
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error generating summary",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast, createNode]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Historical Context Analysis</h1>
          <p className="text-gray-600">Analyze and visualize historical relationships</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <TextEditor 
              onCreateNode={createNode} 
              text={text}
              onTextChange={(newText) => {
                setText(newText);
                generateSummary(newText);
              }}
            />
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold mb-4">تحليل الملخص</h2>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="سيتم إنشاء الملخص تلقائياً أثناء الكتابة..."
                className="min-h-[150px] text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4">مخطط العلاقات</h2>
            <FlowCanvas initialNodes={nodes} initialEdges={edges} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
