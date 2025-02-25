import React from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Landmark, User, Calendar, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeData } from "@/lib/types";

interface BaseNodeProps {
  data: NodeData;
  selected?: boolean;
  isConnectable: boolean;
  draggable?: boolean;
}

const nodeConfig = {
  person: {
    icon: User,
    gradient: "from-blue-100 to-blue-200",
    border: "border-blue-300",
    shape: "rounded-full",
  },
  place: {
    icon: Landmark,
    gradient: "from-green-100 to-green-200",
    border: "border-green-300",
    shape: "rounded-lg",
  },
  event: {
    icon: Calendar,
    gradient: "from-red-100 to-red-200",
    border: "border-red-300",
    shape: "rounded-xl",
  },
  concept: {
    icon: Lightbulb,
    gradient: "from-purple-100 to-purple-200",
    border: "border-purple-300",
    shape: "rounded-[2rem]",
  },
};

export default function BaseNode({
  data,
  selected,
  isConnectable,
  draggable = true,
}: BaseNodeProps) {
  const config = nodeConfig[data.type as keyof typeof nodeConfig] || nodeConfig.concept;
  const Icon = config.icon;

  const nodeProps = {
    className: cn(
      "min-w-[180px] min-h-[90px] border-2 shadow-lg p-4 bg-gradient-to-br cursor-grab active:cursor-grabbing",
      config.gradient,
      config.border,
      config.shape,
      selected && "ring-2 ring-offset-2 ring-black"
    ),
    draggable: draggable,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div {...nodeProps}>
            <Handle
              type="target"
              position={Position.Top}
              className="w-2 h-2"
              isConnectable={isConnectable}
            />
            <div className="flex items-center gap-3">
              {data.imageUrl ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={data.imageUrl}
                    alt={data.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="font-semibold">{data.label}</div>
                {data.subtitle && (
                  <div className="text-sm text-muted-foreground">{data.subtitle}</div>
                )}
              </div>
            </div>
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-2 h-2"
              isConnectable={isConnectable}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {data.description ||
              `${data.type.charAt(0).toUpperCase() + data.type.slice(1)}: ${data.label}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
