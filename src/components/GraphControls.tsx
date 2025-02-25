import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGraph } from "@/context/GraphContext";
import { NodeType, EdgeType } from "@/lib/types";

export default function GraphControls() {
  const {
    selectedNode,
    selectedEdge,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
  } = useGraph();

  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [newNode, setNewNode] = useState<{
    type: NodeType;
    label: string;
    subtitle?: string;
    imageUrl?: string;
  }>({
    type: "person",
    label: "",
  });
  const [newEdge, setNewEdge] = useState<{
    source: string;
    target: string;
    label: string;
    type: EdgeType;
  }>({
    source: "",
    target: "",
    label: "",
    type: "influences",
  });

  return (
    <div className="fixed top-4 left-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg space-y-4">
      <div className="space-x-2">
        <Dialog open={isAddNodeOpen} onOpenChange={setIsAddNodeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Node</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newNode.type}
                  onValueChange={(value: NodeType) =>
                    setNewNode({ ...newNode, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="place">Place</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="concept">Concept</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newNode.label}
                  onChange={(e) =>
                    setNewNode({ ...newNode, label: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (optional)</Label>
                <Input
                  value={newNode.subtitle || ""}
                  onChange={(e) =>
                    setNewNode({ ...newNode, subtitle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input
                  value={newNode.imageUrl || ""}
                  onChange={(e) =>
                    setNewNode({ ...newNode, imageUrl: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={() => {
                  addNode(newNode);
                  setIsAddNodeOpen(false);
                  setNewNode({ type: "person", label: "" });
                }}
              >
                Add Node
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddEdgeOpen} onOpenChange={setIsAddEdgeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Connection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newEdge.type}
                  onValueChange={(value: EdgeType) =>
                    setNewEdge({ ...newEdge, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="causes">Causes</SelectItem>
                    <SelectItem value="influences">Influences</SelectItem>
                    <SelectItem value="participates">Participates</SelectItem>
                    <SelectItem value="located">Located At</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source Node ID</Label>
                <Input
                  value={newEdge.source}
                  onChange={(e) =>
                    setNewEdge({ ...newEdge, source: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Target Node ID</Label>
                <Input
                  value={newEdge.target}
                  onChange={(e) =>
                    setNewEdge({ ...newEdge, target: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newEdge.label}
                  onChange={(e) =>
                    setNewEdge({ ...newEdge, label: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={() => {
                  addEdge(newEdge);
                  setIsAddEdgeOpen(false);
                  setNewEdge({
                    source: "",
                    target: "",
                    label: "",
                    type: "influences",
                  });
                }}
              >
                Add Connection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedNode && (
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="font-medium">Selected Node</h3>
          <p className="text-sm text-muted-foreground">{selectedNode.label}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeNode(selectedNode.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="font-medium">Selected Connection</h3>
          <p className="text-sm text-muted-foreground">{selectedEdge.label}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeEdge(selectedEdge.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
