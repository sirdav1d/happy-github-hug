import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { DISC_LABELS, type DISCScores } from '@/types/behavioral';

interface DISCRadarChartProps {
  natural?: DISCScores | null;
  adapted?: DISCScores | null;
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
}

export function DISCRadarChart({ 
  natural, 
  adapted, 
  size = 'md',
  showLegend = true 
}: DISCRadarChartProps) {
  const data = useMemo(() => {
    const dimensions: ('d' | 'i' | 's' | 'c')[] = ['d', 'i', 's', 'c'];
    
    return dimensions.map(dim => ({
      dimension: DISC_LABELS[dim].name,
      shortName: dim.toUpperCase(),
      natural: natural?.[dim] ?? 0,
      adapted: adapted?.[dim] ?? 0,
      fullMark: 100,
    }));
  }, [natural, adapted]);
  
  const heights = {
    sm: 200,
    md: 280,
    lg: 360,
  };
  
  const hasData = natural || adapted;
  
  if (!hasData) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground"
        style={{ height: heights[size] }}
      >
        Sem dados DISC
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={heights[size]}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.5}
        />
        <PolarAngleAxis 
          dataKey="shortName" 
          tick={{ 
            fill: 'hsl(var(--foreground))', 
            fontSize: size === 'sm' ? 12 : 14,
            fontWeight: 600 
          }}
        />
        <PolarRadiusAxis 
          angle={45} 
          domain={[0, 100]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          tickCount={5}
        />
        
        {natural && (
          <Radar
            name="Natural"
            dataKey="natural"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        )}
        
        {adapted && (
          <Radar
            name="Adaptado"
            dataKey="adapted"
            stroke="hsl(var(--accent))"
            fill="hsl(var(--accent))"
            fillOpacity={0.2}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        )}
        
        {showLegend && (natural && adapted) && (
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))', fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Componente de resumo DISC com scores
interface DISCScoreSummaryProps {
  scores: DISCScores;
  variant?: 'natural' | 'adapted';
}

export function DISCScoreSummary({ scores, variant = 'natural' }: DISCScoreSummaryProps) {
  const dimensions: ('d' | 'i' | 's' | 'c')[] = ['d', 'i', 's', 'c'];
  const sorted = [...dimensions].sort((a, b) => scores[b] - scores[a]);
  
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {variant === 'natural' ? 'Perfil Natural' : 'Perfil Adaptado'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {dimensions.map((dim, index) => {
          const isTop = dim === sorted[0] || dim === sorted[1];
          return (
            <div 
              key={dim}
              className={`text-center p-2 rounded-lg transition-all ${
                isTop 
                  ? 'bg-primary/10 ring-1 ring-primary/30' 
                  : 'bg-muted/50'
              }`}
            >
              <div 
                className="text-lg font-bold"
                style={{ color: DISC_LABELS[dim].color }}
              >
                {dim.toUpperCase()}
              </div>
              <div className="text-sm font-medium">{scores[dim]}</div>
              <div className="text-xs text-muted-foreground truncate">
                {DISC_LABELS[dim].name}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Perfil predominante: <span className="font-medium text-foreground">
          {sorted[0].toUpperCase()}/{sorted[1].toUpperCase()}
        </span>
      </p>
    </div>
  );
}
