import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHighlightStore } from "../utils/highlightStore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RelationshipsTable from '../components/RelationshipsTable';
import { EdgeDialog } from '../components/EdgeDialog';

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface AnalysisProps {
  onAnalysisComplete?: (relationships: Relationship[]) => void;
}

export default function Analysis({ onAnalysisComplete }: AnalysisProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState([0.7]);
  const [autoHighlight, setAutoHighlight] = useState(true);
  const { addHighlight } = useHighlightStore();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [currentRelationship, setCurrentRelationship] = useState<{ source: string; target: string } | null>(null);

  // عند إتمام تعديل العلاقة من خلال الحوار، يتم تحديث الحالة وإعادة عرض الجدول
  const handleEdgeComplete = useCallback(
    (type: string, customLabel?: string) => {
      if (!currentRelationship) return;
      
      const newRelationship: Relationship = {
        source: currentRelationship.source,
        target: currentRelationship.target,
        type,
      };

      const updatedRelationships = [...relationships, newRelationship];
      setRelationships(updatedRelationships);
      onAnalysisComplete?.(updatedRelationships);
      setIsEdgeDialogOpen(false);
      setCurrentRelationship(null);
    },
    [currentRelationship, relationships, onAnalysisComplete]
  );

  // الدالة المسؤولة عن تحليل النص واستلام الاستجابة من API
  const analyzeText = useCallback(async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Triggering Supabase analyze-text function with:", {
        text: text.substring(0, 100) + "...", // تسجيل أول 100 حرف فقط للتبسيط
        temperature: temperature[0],
      });

      const { data, error } = await supabase.functions.invoke("analyze-text", {
        body: { 
          text,
          temperature: temperature[0]
        },
      });

      if (error) throw error;

      console.log("Received response from analyze-text:", data);

      // التحقق من صحة الاستجابة مع التأكد من وجود مصفوفة relationships
      if (!data || !Array.isArray(data.relationships)) {
        throw new Error("Invalid response format from API");
      }

      // تحويل بيانات العلاقات الواردة إلى التنسيق المطلوب
      const formattedRelationships: Relationship[] = data.relationships.map((rel: any) => ({
        source: rel.source,
        target: rel.target,
        type: rel.type || "related-to",
      }));

      console.log("Formatted relationships:", formattedRelationships);

      // تعيين العلاقات إلى الحالة بحيث تُستخدم لاحقًا في جدول العلاقات
      setRelationships(formattedRelationships);
      onAnalysisComplete?.(formattedRelationships);

      // تمييز الكيانات في النص تلقائيًا إذا كان الخيار مفعلاً
      if (autoHighlight) {
        formattedRelationships.forEach((rel) => {
          [rel.source, rel.target].forEach((entity) => {
            const startIndex = text.indexOf(entity);
            if (startIndex !== -1) {
              addHighlight({
                id: `highlight-${Date.now()}-${Math.random()}`,
                text: entity,
                from: startIndex,
                to: startIndex + entity.length,
              });
            }
          });
        });
      }

      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze text");
    } finally {
      setIsLoading(false);
    }
  }, [text, temperature, autoHighlight, addHighlight, onAnalysisComplete]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Historical Text</Label>
          <Textarea
            placeholder="Enter historical text to analyze..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-[200px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Temperature: {temperature}</Label>
          <Slider
            value={temperature}
            onValueChange={setTemperature}
            max={1}
            step={0.1}
            className="w-[200px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto-highlight"
            checked={autoHighlight}
            onCheckedChange={setAutoHighlight}
          />
          <Label htmlFor="auto-highlight">Auto-highlight entities</Label>
        </div>

        <Button 
          onClick={analyzeText} 
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? "Analyzing..." : "Analyze Text"}
        </Button>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Relationship Analysis</h2>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <RelationshipsTable 
            relationships={relationships}
            onEdit={(rel, index) => {
              setCurrentRelationship({ source: rel.source, target: rel.target });
              setIsEdgeDialogOpen(true);
            }}
            onDelete={(index) => {
              const newRelationships = [...relationships];
              newRelationships.splice(index, 1);
              setRelationships(newRelationships);
              onAnalysisComplete?.(newRelationships);
            }}
          />
        )}
      </div>

      <EdgeDialog
        isOpen={isEdgeDialogOpen}
        onClose={() => {
          setIsEdgeDialogOpen(false);
          setCurrentRelationship(null);
        }}
        onConfirm={handleEdgeComplete}
        defaultType="related-to"
      />
    </div>
  );
}
