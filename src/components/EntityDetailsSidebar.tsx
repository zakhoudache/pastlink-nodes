import React from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X, Edit, Trash2 } from "lucide-react";
import { useGraph } from "@/context/GraphContext";
import { NodeData } from "@/lib/types";

const EntityDetailsSidebar = () => {
  const { selectedNode, selectNode, removeNode, nodes, edges } = useGraph();

  if (!selectedNode) {
    return null;
  }

  // Find connections related to this node
  const connections = edges
    .filter(
      (edge) =>
        edge.source === selectedNode.id || edge.target === selectedNode.id,
    )
    .map((edge) => {
      const isSource = edge.source === selectedNode.id;
      const connectedNodeId = isSource ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);

      return {
        id: edge.id,
        type: isSource ? edge.label : `is ${edge.label} of`,
        connectedTo: connectedNode?.data.label || "Unknown",
      };
    });

  const typeColors = {
    person: "bg-blue-100 text-blue-800",
    event: "bg-red-100 text-red-800",
    place: "bg-green-100 text-green-800",
    concept: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className="w-[400px] h-full bg-background border-l">
      <div className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{selectedNode.label}</h2>
          <Badge className={typeColors[selectedNode.type]}>
            {selectedNode.type.charAt(0).toUpperCase() +
              selectedNode.type.slice(1)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeNode(selectedNode.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => selectNode(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">
              {selectedNode.description || "No description available."}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Connections</h3>
            <h3 className="text-sm font-medium mb-2">Connections</h3>
            {connections.length > 0 ? (
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="p-2 rounded-lg border bg-muted/50"
                  >
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        {connection.type}
                      </span>{" "}
                      <span className="font-medium">
                        {connection.connectedTo}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No connections found.
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};

export default EntityDetailsSidebar;
