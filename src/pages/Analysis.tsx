
'use client';

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHighlightStore } from "../utils/highlightStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Analysis() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState([0.9]);
  const [autoHighlight, setAutoHighlight] = useState(true);
  const { highlights, addHighlight } = useHighlightStore();

  const analyzeText = useCallback(async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: { text },
      });

      if (error) throw error;

      if (data.entities && data.relationships) {
        // Dispatch a custom event with the analysis results
        const event = new CustomEvent('analysisResults', {
          detail: {
            entities: data.entities,
            relationships: data.relationships,
          },
        });
        window.dispatchEvent(event);

        if (autoHighlight) {
          data.entities.forEach((entity: { text: string }) => {
            const startIndex = text.indexOf(entity.text);
            if (startIndex !== -1) {
              addHighlight({
                id: `highlight-${Date.now()}-${Math.random()}`,
                text: entity.text,
                from: startIndex,
                to: startIndex + entity.text.length,
              });
            }
          });
        }

        toast.success("Analysis complete!");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze text");
    } finally {
      setIsLoading(false);
    }
  }, [text, autoHighlight, addHighlight]);

  return (
    <div className="space-y-4">
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
        <Label htmlFor="auto-highlight">Auto-highlight important elements</Label>
      </div>

      <Button onClick={analyzeText} disabled={isLoading}>
        {isLoading ? "Analyzing..." : "Analyze Text"}
      </Button>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Highlights</h3>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        ) : highlights.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Text</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highlights.map((highlight) => (
                <TableRow key={highlight.id}>
                  <TableCell>{highlight.text}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Use
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No highlights yet</p>
        )}
      </div>
    </div>
  );
}
