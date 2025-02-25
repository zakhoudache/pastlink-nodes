import React from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Landmark, User, Calendar, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeType } from "@/lib/types";

export interface HistoricalNodeData {
  type: NodeType;
  label: string;
  description?: string;
}

const nodeConfig = {
  person: {
    icon: User,
    gradient: "from-blue-100 to-blue-200",
    border: "border-blue-300",
    shape: "rounded-full",
    animation: {
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity },
    },
  },
  place: {
    icon: Landmark,
    gradient: "from-green-100 to-green-200",
    border: "border-green-300",
    shape: "rounded-lg",
    animation: { y: [0, -2, 0], transition: { duration: 3, repeat: Infinity } },
  },
  event: {
    icon: Calendar,
    gradient: "from-red-100 to-red-200",
    border: "border-red-300",
    shape: "rounded-xl",
    animation: {
      rotate: [0, 1, 0],
      transition: { duration: 4, repeat: Infinity },
    },
  },
  concept: {
    icon: Lightbulb,
    gradient: "from-purple-100 to-purple-200",
    border: "border-purple-300",
    shape: "rounded-[2rem]",
    animation: {
      opacity: [0.8, 1, 0.8],
      transition: { duration: 3, repeat: Infinity },
    },
  },
};

interface HistoricalNodeProps {
  data: HistoricalNodeData;
  selected?: boolean;
}

const HistoricalNode: React.FC<HistoricalNodeProps> = ({ data, selected }) => {
  const config = nodeConfig[data.type as keyof typeof nodeConfig] || nodeConfig.concept;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "min-w-[180px] min-h-[90px] border-2 shadow-lg p-4 transition-shadow bg-gradient-to-br",
              config.gradient,
              config.border,
              config.shape,
              selected && "ring-2 ring-offset-2 ring-black",
            )}
            animate={config.animation}
          >
            <Handle type="target" position={Position.Top} className="w-2 h-2" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">{data.label}</div>
                {data.description && (
                  <div className="text-sm text-muted-foreground">
                    {data.description}
                  </div>
                )}
              </div>
            </div>
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-2 h-2"
            />
          </motion.div>
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
};

export default HistoricalNode;
