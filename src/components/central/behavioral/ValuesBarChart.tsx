import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { VALUES_LABELS, type ValuesScores } from '@/types/behavioral';

interface ValuesBarChartProps {
  values: ValuesScores | null;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

export function ValuesBarChart({ 
  values, 
  size = 'md',
  orientation = 'horizontal' 
}: ValuesBarChartProps) {
  const data = useMemo(() => {
    if (!values) return [];
    
    const keys: (keyof ValuesScores)[] = ['economic', 'political', 'theoretical', 'individualist', 'altruistic', 'regulatory', 'aesthetic'];
    
    const entries = keys.map(key => ({
      key,
      value: values[key],
      label: VALUES_LABELS[key].name,
      color: VALUES_LABELS[key].color,
    }));
    
    return entries.sort((a, b) => b.value - a.value);
  }, [values]);
  
  const heights = {
    sm: 180,
    md: 250,
    lg: 320,
  };
  
  if (!values) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground"
        style={{ height: heights[size] }}
      >
        Sem dados de motivadores
      </div>
    );
  }
  
  if (orientation === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={heights[size]}>
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis 
            type="category" 
            dataKey="label" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            width={75}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="font-medium" style={{ color: item.color }}>{item.label}</p>
                    <p className="text-sm text-muted-foreground">{VALUES_LABELS[item.key as keyof ValuesScores].description}</p>
                    <p className="text-lg font-bold mt-1">{item.value}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={heights[size]}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
        <XAxis 
          dataKey="label" 
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium" style={{ color: item.color }}>{item.label}</p>
                  <p className="text-sm text-muted-foreground">{VALUES_LABELS[item.key as keyof ValuesScores].description}</p>
                  <p className="text-lg font-bold mt-1">{item.value}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Componente de lista de valores ordenados
interface ValuesRankListProps {
  values: ValuesScores;
  limit?: number;
}

export function ValuesRankList({ values, limit = 7 }: ValuesRankListProps) {
  const sorted = useMemo(() => {
    const entries = Object.entries(values) as [keyof ValuesScores, number][];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }, [values, limit]);
  
  return (
    <div className="space-y-2">
      {sorted.map(([key, value], index) => {
        const info = VALUES_LABELS[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: info.color }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{info.name}</span>
                <span className="text-sm text-muted-foreground">{value}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${value}%`, 
                    backgroundColor: info.color 
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
