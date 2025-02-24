
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { HistoricalNodeData } from '../HistoricalNode';
import { supabase } from "@/integrations/supabase/client";

// Import typeIcons from HistoricalNode
const typeIcons: Record<string, string> = {
  event: '📅',
  person: '👤',
  cause: '⚡',
  political: '🏛️',
  economic: '💰',
  social: '👥',
  cultural: '🎭',
  term: '📖',
  date: '⏰',
  goal: '🎯',
  indicator: '📊',
  country: '🌍',
  other: '❔',
};

interface NodeContextPanelProps {
  selectedNode: {
    id: string;
    data: HistoricalNodeData;
  } | null;
}

async function generateNodeContext(nodeData: HistoricalNodeData) {
  const { data, error } = await supabase.functions.invoke("analyze-node", {
    body: {
      label: nodeData.label,
      type: nodeData.type,
      description: nodeData.description,
    },
  });

  console.log("Supabase function response:", { data, error });

  if (error) {
    console.error("Error generating context:", error);
    throw new Error(error.message || "Failed to analyze node");
  }

  if (!data || !data.context) {
    console.error("Unexpected response structure:", data);
    throw new Error("Invalid response from analyze-node function");
  }

  return data.context;
}

export function NodeContextPanel({ selectedNode }: NodeContextPanelProps) {
  const { data: context, isLoading, error } = useQuery({
    queryKey: ['nodeContext', selectedNode?.id],
    queryFn: () => (selectedNode ? generateNodeContext(selectedNode.data) : null),
    enabled: !!selectedNode,
  });

  if (!selectedNode) {
    return null;
  }

  const nodeIcon = typeIcons[selectedNode.data.type] || typeIcons.other;

  return (
    <Sheet defaultOpen>
      <SheetContent side="right" className="w-[320px] pr-10">
        <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
        <SheetHeader className="border-b border-gray-200 pb-4 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {nodeIcon}
            </span>
            <SheetTitle>{selectedNode.data.label}</SheetTitle>
          </div>
        </SheetHeader>
        <div className="mt-4">
          <ScrollArea className="h-[calc(100vh-120px)]">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : error ? (
              <div className="text-red-500">
                Failed to load context. Please try again later.
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">{context}</div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
