import React, { useState } from "react";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ArrowRight, X, AlertCircle } from "lucide-react";
import { useGraph } from "@/context/GraphContext";
import { Entity, NodeType } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";

const TextAnalysisPanel = () => {
  const {
    entities,
    setEntities,
    analyzeText,
    convertEntitiesToNodes,
    loading,
    error,
  } = useGraph();

  const [text, setText] = useState(
    "George Washington lived at Mount Vernon during the American Revolution...",
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleAnalyzeText = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      const newEntities = await analyzeText(text);
      setEntities(newEntities);
    } catch (error) {
      console.error("Error during text analysis:", error);
      // Error is handled by the GraphContext and displayed below
    }
  };

  const handleAddToGraph = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId);
    if (entity) {
      convertEntitiesToNodes([entity]);
    }
  };

  const handleAddAllToGraph = () => {
    if (entities.length > 0) {
      convertEntitiesToNodes(entities);
    }
  };

  const handleRemoveEntity = (id: string) => {
    setEntities(entities.filter((entity) => entity.id !== id));
  };

// Update the type check in TextAnalysisPanel
const getEntityColor = (type: NodeType) => {
  switch (type) {
    case "person":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "event":
      return "bg-red-100 text-red-800 border-red-300";
    case "place":
      return "bg-green-100 text-green-800 border-green-300";
    case "concept":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

  return (
    <Card className="h-full w-[400px] bg-white flex flex-col p-4 border-r">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Text Analysis</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyzeText}
          disabled={loading || !text.trim()}
        >
          {loading ? "Analyzing..." : "Analyze Text"}
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your historical text here..."
          className="min-h-[200px] resize-none mb-4"
          disabled={loading}
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Detected Entities</h3>
            {entities.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAllToGraph}
                disabled={loading}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Add All to Graph
              </Button>
            )}
          </div>

          {entities.map((entity) => (
            <div
              key={entity.id}
              className={`flex items-center justify-between p-2 rounded border ${getEntityColor(
                entity.type,
              )}`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">{entity.text}</span>
                <span className="text-sm opacity-70 capitalize">
                  ({entity.type})
                </span>
              </div>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 mr-1"
                  onClick={() => handleAddToGraph(entity.id)}
                  title="Add to Graph"
                  disabled={loading}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveEntity(entity.id)}
                  title="Remove"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {entities.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              No entities detected. Use Analyze Text to analyze the text.
            </p>
          )}

          {loading && entities.length === 0 && (
            <p className="text-sm text-muted-foreground">Analyzing text...</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default TextAnalysisPanel;
