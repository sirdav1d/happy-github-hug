import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DISCScores } from '@/types/behavioral';

interface DISCBadgeProps {
  scores: DISCScores;
  className?: string;
  size?: 'sm' | 'md';
}

const DISC_CONFIG: Record<keyof DISCScores, { 
  label: string; 
  fullLabel: string;
  color: string; 
  bgColor: string;
  description: string;
}> = {
  d: { 
    label: 'D', 
    fullLabel: 'Dominância',
    color: 'text-rose-600', 
    bgColor: 'bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25',
    description: 'Direto, decidido, focado em resultados'
  },
  i: { 
    label: 'I', 
    fullLabel: 'Influência',
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25',
    description: 'Entusiasta, comunicativo, otimista'
  },
  s: { 
    label: 'S', 
    fullLabel: 'Estabilidade',
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25',
    description: 'Paciente, confiável, metódico'
  },
  c: { 
    label: 'C', 
    fullLabel: 'Conformidade',
    color: 'text-blue-600', 
    bgColor: 'bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25',
    description: 'Analítico, preciso, detalhista'
  },
};

export function getDominantDISC(scores: DISCScores): keyof DISCScores {
  const entries = Object.entries(scores) as [keyof DISCScores, number][];
  return entries.reduce((max, [key, value]) => 
    value > scores[max] ? key : max, 'd' as keyof DISCScores
  );
}

export function DISCBadge({ scores, className, size = 'sm' }: DISCBadgeProps) {
  const dominant = getDominantDISC(scores);
  const config = DISC_CONFIG[dominant];

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "font-bold cursor-help transition-colors border",
            config.bgColor,
            config.color,
            size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
            className
          )}
        >
          {config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        align="center"
        sideOffset={6}
        className={cn(
          "max-w-xs p-3 z-[100] bg-popover text-popover-foreground"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("font-bold", config.color)}>{config.fullLabel}</span>
            <span className="text-xs opacity-80">({scores[dominant]})</span>
          </div>

          <p className="text-xs opacity-80">{config.description}</p>

          <div className="border-t border-border pt-2 mt-2">
            <p className="text-[10px] font-medium opacity-70 mb-1.5">Perfil Completo:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(DISC_CONFIG) as [keyof DISCScores, typeof DISC_CONFIG.d][]).map(([key, cfg]) => (
                <div 
                  key={key} 
                  className={cn(
                    "text-center rounded px-1 py-0.5",
                    key === dominant ? cfg.bgColor : "bg-muted/50"
                  )}
                >
                  <div className={cn("text-xs font-bold", key === dominant ? cfg.color : "opacity-70")}>
                    {cfg.label}
                  </div>
                  <div className="text-[10px] opacity-80">{scores[key]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default DISCBadge;
