import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  text: string;
  variant?: 'info' | 'help';
  maxWidth?: number;
  size?: 'sm' | 'md';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  text, 
  variant = 'info',
  maxWidth = 280,
  size = 'sm'
}) => {
  const Icon = variant === 'help' ? HelpCircle : Info;
  const iconSize = size === 'sm' ? 14 : 16;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className="inline-flex items-center justify-center ml-1 align-middle text-muted-foreground hover:text-primary transition-colors cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
            aria-label="Mais informações"
          >
            <Icon size={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          className="z-50 px-3 py-2 text-xs leading-relaxed text-center"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;
