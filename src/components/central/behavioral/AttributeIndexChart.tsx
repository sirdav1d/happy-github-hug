import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from 'recharts';
import type { AttributeScores } from '@/types/behavioral';
import { ATTRIBUTE_LABELS } from '@/types/behavioral';

interface AttributeIndexChartProps {
  attributes: AttributeScores;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function AttributeIndexChart({ 
  attributes, 
  size = 'md',
  showLabels = true 
}: AttributeIndexChartProps) {
  const data = (Object.keys(attributes) as Array<keyof AttributeScores>).map(key => ({
    key,
    name: ATTRIBUTE_LABELS[key].name,
    value: attributes[key],
    color: ATTRIBUTE_LABELS[key].color,
  }));

  const height = size === 'sm' ? 180 : size === 'md' ? 240 : 300;
  const barSize = size === 'sm' ? 12 : size === 'md' ? 16 : 20;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{item.name}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {ATTRIBUTE_LABELS[item.key as keyof AttributeScores].description}
          </p>
          <p className="font-bold mt-2" style={{ color: item.color }}>
            {item.value.toFixed(1)} / 10
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: showLabels ? 100 : 10, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            domain={[0, 10]} 
            tickCount={6}
            tick={{ fontSize: size === 'sm' ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={showLabels ? { fontSize: size === 'sm' ? 10 : 12, fill: 'hsl(var(--foreground))' } : false}
            width={showLabels ? 95 : 0}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={5} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
          <Bar 
            dataKey="value" 
            barSize={barSize}
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
