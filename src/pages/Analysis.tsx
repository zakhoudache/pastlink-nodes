'use client';

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

interface Relationship {
  source: string;
  target: string;
  type: string;
}

export default function Analysis() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState([0.7]);
  const [autoHighlight, setAutoHighlight] = useState(true);
  const { highlights, addHighlight } = useHighlightStore();
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const analyzeText = useCallback(async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: { 
          text,
          temperature: temperature[0]
        },
      });

      if (error) throw error;

      if (!data || !Array.isArray(data.relationships)) {
        throw new Error("Invalid response format from API");
      }

      setRelationships(data.relationships);

      if (autoHighlight) {
        // Highlight both source and target entities
        data.relationships.forEach((rel: Relationship) => {
          [rel.source, rel.target].forEach(entity => {
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

    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze text");
    } finally {
      setIsLoading(false);
    }
  }, [text, temperature, autoHighlight, addHighlight]);

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
        <Label htmlFor="auto-highlight">Auto-highlight entities</Label>
      </div>

      <Button 
        onClick={analyzeText} 
        disabled={isLoading}
        className="w-full md:w-auto"
      >
        {isLoading ? "Analyzing..." : "Analyze Text"}
      </Button>

      {relationships.length > 0 && (
        <RelationshipsTable relationships={relationships} />
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Highlights</h3>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        ) : highlights.length > 0 ? (
          <div className="border rounded-lg p-4">
            {highlights.map((highlight) => (
              <div key={highlight.id} className="flex items-center justify-between py-2">
                <span>{highlight.text}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // Add your highlight action here
                  }}
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No highlights yet</p>
        )}
      </div>
    </div>
  );
}