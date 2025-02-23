import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import type { HistoricalNodeData } from '../HistoricalNode';

interface NodeContextPanelProps {
  selectedNode: {
    id: string;
    data: HistoricalNodeData;
  } | null;
}

async function generateNodeContext(nodeData: HistoricalNodeData) {
  try {
    const response = await fetch(`https://uimmjzuqdqxfqoikcexf.supabase.co/functions/v1/analyze-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        label: nodeData.label,
        type: nodeData.type,
        description: nodeData.description,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze node');
    }

    const data = await response.json();
    return data.context;
  } catch (error) {
    console.error('Error generating context:', error);
    throw error;
  }
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedNode.data.type === 'person' ? '👤' : '📝'}</span>
              <h2 className="text-lg font-semibold">{selectedNode.data.label}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('closeNodeContext'))}>
              ✕
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4">
          <ScrollArea className="h-[calc(100vh-120px)]">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : error ? (
              <div className="text-red-500">Failed to load context. Please try again later.</div>
            ) : (
              <div className="prose prose-sm max-w-none">{context}</div>
            )}
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
