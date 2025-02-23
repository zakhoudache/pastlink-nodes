
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { useHighlightStore } from "../utils/highlightStore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RelationshipsTable from '../components/RelationshipsTable';
import { EdgeDialog } from '../components/EdgeDialog';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    const [error, setError] = useState<string | null>(null);
    const { addHighlight } = useHighlightStore();
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
    const [currentRelationship, setCurrentRelationship] = useState<{ source: string; target: string } | null>(null);

    const handleEditRelationship = useCallback((relationship: Relationship, index: number) => {
        setCurrentRelationship(relationship);
        setIsEdgeDialogOpen(true);
    }, []);

    const handleEdgeComplete = useCallback((newType: string, customLabel?: string) => {
        if (!currentRelationship) return;

        const indexToUpdate = relationships.findIndex(rel =>
            rel.source === currentRelationship.source && rel.target === currentRelationship.target
        );

        if (indexToUpdate === -1) {
            console.error("Relationship not found for updating.");
            return;
        }

        const updatedRelationships = [...relationships];
        updatedRelationships[indexToUpdate] = {
            ...updatedRelationships[indexToUpdate],
            type: newType,
        };

        setRelationships(updatedRelationships);
        onAnalysisComplete?.(updatedRelationships);
        setIsEdgeDialogOpen(false);
        setCurrentRelationship(null);
    }, [relationships, currentRelationship, onAnalysisComplete]);

    const analyzeText = useCallback(async () => {
        const trimmedText = text.trim();
        if (!trimmedText) {
            toast.error("Please enter some text to analyze");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("Analyzing text:", { 
                textLength: trimmedText.length,
                temperature: temperature[0] 
            });

            const { data, error } = await supabase.functions.invoke("analyze-text", {
                body: {
                    text: trimmedText,
                    temperature: temperature[0]
                },
            });

            if (error) throw error;

            console.log("Analysis response:", data);

            if (!data || !Array.isArray(data.relationships)) {
                throw new Error("Invalid response format from API");
            }

            const formattedRelationships: Relationship[] = data.relationships.map((rel: any) => ({
                source: rel.source,
                target: rel.target,
                type: rel.type || "related-to",
            }));

            console.log("Formatted relationships:", formattedRelationships);

            setRelationships(formattedRelationships);
            onAnalysisComplete?.(formattedRelationships);

            if (autoHighlight) {
                const processedEntities = new Set();
                formattedRelationships.forEach((rel) => {
                    [rel.source, rel.target].forEach((entity) => {
                        if (!processedEntities.has(entity)) {
                            const startIndex = text.indexOf(entity);
                            if (startIndex !== -1) {
                                addHighlight({
                                    id: `highlight-${Date.now()}-${Math.random()}`,
                                    text: entity,
                                    from: startIndex,
                                    to: startIndex + entity.length,
                                });
                                processedEntities.add(entity);
                            }
                        }
                    });
                });
            }

            toast.success("Analysis complete!");
        } catch (error: any) {
            console.error("Analysis error:", error);
            const errorMessage = error.message || "Failed to analyze text";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [text, temperature, autoHighlight, addHighlight, onAnalysisComplete]);

    return (
        <div className="space-y-6">
            <Card className="p-4">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="historical-text">Historical Text</Label>
                        <Textarea
                            id="historical-text"
                            dir="rtl"
                            placeholder="Enter historical text to analyze..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="h-[200px] font-arabic"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Temperature: {temperature[0]}</Label>
                            <span className="text-sm text-gray-500">
                                Higher = more creative, Lower = more focused
                            </span>
                        </div>
                        <Slider
                            value={temperature}
                            onValueChange={setTemperature}
                            max={1}
                            step={0.1}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="auto-highlight"
                            checked={autoHighlight}
                            onCheckedChange={setAutoHighlight}
                            disabled={isLoading}
                        />
                        <Label htmlFor="auto-highlight">Auto-highlight detected entities</Label>
                    </div>

                    <Button
                        onClick={analyzeText}
                        disabled={isLoading || !text.trim()}
                        className="w-full md:w-auto"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            "Analyze Text"
                        )}
                    </Button>
                </div>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="p-4 space-y-4">
                <h2 className="text-lg font-semibold">Relationship Analysis</h2>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : relationships.length > 0 ? (
                    <RelationshipsTable
                        relationships={relationships}
                        onEdit={handleEditRelationship}
                        onDelete={(index) => {
                            const newRelationships = [...relationships];
                            newRelationships.splice(index, 1);
                            setRelationships(newRelationships);
                            onAnalysisComplete?.(newRelationships);
                        }}
                    />
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        No relationships detected yet. Enter some text and click "Analyze Text" to begin.
                    </div>
                )}
            </Card>

            {currentRelationship && (
                <EdgeDialog
                    isOpen={isEdgeDialogOpen}
                    onClose={() => {
                        setIsEdgeDialogOpen(false);
                        setCurrentRelationship(null);
                    }}
                    onConfirm={handleEdgeComplete}
                    defaultType="related-to"
                />
            )}
        </div>
    );
}
