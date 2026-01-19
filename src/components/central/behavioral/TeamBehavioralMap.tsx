import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import type { BehavioralProfile, DISCScores } from '@/types/behavioral';
import { DISC_LABELS } from '@/types/behavioral';

interface TeamBehavioralMapProps {
  profiles: BehavioralProfile[];
  salespeople: Array<{ id: string; name: string }>;
}

interface DataPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  profile: BehavioralProfile;
  dominantType: keyof DISCScores;
}

const QUADRANT_LABELS = {
  D: { x: 75, y: 75, label: 'Dominância', color: DISC_LABELS.d.color, emoji: '🔥' },
  I: { x: 25, y: 75, label: 'Influência', color: DISC_LABELS.i.color, emoji: '✨' },
  S: { x: 25, y: 25, label: 'Estabilidade', color: DISC_LABELS.s.color, emoji: '🌿' },
  C: { x: 75, y: 25, label: 'Conformidade', color: DISC_LABELS.c.color, emoji: '📊' },
};

export function TeamBehavioralMap({ profiles, salespeople }: TeamBehavioralMapProps) {
  const profilesWithDISC = profiles.filter(p => p.discNatural);

  const data: DataPoint[] = useMemo(() => {
    return profilesWithDISC.map(profile => {
      const disc = profile.discNatural!;
      const salesperson = salespeople.find(sp => sp.id === profile.salespersonId);
      
      // Calculate position based on DISC dimensions
      // X axis: D+C (Task) vs I+S (People)
      // Y axis: D+I (Outgoing) vs S+C (Reserved)
      const taskOrientation = (disc.d + disc.c) / 2;
      const outgoingOrientation = (disc.d + disc.i) / 2;
      
      // Find dominant type
      const entries = Object.entries(disc) as [keyof DISCScores, number][];
      const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      return {
        x: taskOrientation,
        y: outgoingOrientation,
        z: profile.confidenceScore || 50,
        name: salesperson?.name || 'Desconhecido',
        profile,
        dominantType: dominant,
      };
    });
  }, [profilesWithDISC, salespeople]);

  // Calculate team distribution
  const distribution = useMemo(() => {
    const counts = { d: 0, i: 0, s: 0, c: 0 };
    data.forEach(d => counts[d.dominantType]++);
    const total = data.length || 1;
    return {
      d: Math.round((counts.d / total) * 100),
      i: Math.round((counts.i / total) * 100),
      s: Math.round((counts.s / total) * 100),
      c: Math.round((counts.c / total) * 100),
    };
  }, [data]);

  // Calculate balance score
  const balanceScore = useMemo(() => {
    if (data.length === 0) return 0;
    const values = Object.values(distribution);
    const avg = 25; // Ideal is 25% each
    const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
    return Math.max(0, Math.round(100 - variance / 2));
  }, [distribution]);

  // Find potential gaps
  const gaps = useMemo(() => {
    const gaps: string[] = [];
    if (distribution.d < 10) gaps.push('Falta perfis de liderança (D)');
    if (distribution.i < 10) gaps.push('Falta comunicadores naturais (I)');
    if (distribution.s < 10) gaps.push('Falta perfis de suporte (S)');
    if (distribution.c < 10) gaps.push('Falta analíticos (C)');
    if (distribution.d > 50) gaps.push('Excesso de perfis dominantes');
    if (distribution.i > 50) gaps.push('Equipe muito social, pode faltar foco');
    return gaps;
  }, [distribution]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const point = payload[0].payload as DataPoint;
    const disc = point.profile.discNatural!;
    
    return (
      <Card className="p-3 shadow-lg">
        <div className="space-y-2">
          <div className="font-medium">{point.name}</div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {(Object.entries(disc) as [keyof DISCScores, number][]).map(([key, value]) => (
              <div key={key} className="text-center">
                <div 
                  className="text-lg font-bold"
                  style={{ color: DISC_LABELS[key].color }}
                >
                  {value}
                </div>
                <div className="text-xs text-muted-foreground uppercase">{key}</div>
              </div>
            ))}
          </div>
          <Badge 
            variant="secondary"
            style={{ backgroundColor: `${DISC_LABELS[point.dominantType].color}20` }}
          >
            Dominante: {DISC_LABELS[point.dominantType].name}
          </Badge>
        </div>
      </Card>
    );
  };

  if (profilesWithDISC.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Nenhum perfil DISC mapeado</h3>
          <p className="text-sm text-muted-foreground">
            Crie perfis comportamentais para visualizar a distribuição da equipe
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(distribution) as [keyof DISCScores, number][]).map(([key, value]) => (
          <Card 
            key={key}
            className="bg-gradient-to-br"
            style={{ 
              backgroundImage: `linear-gradient(to bottom right, ${DISC_LABELS[key].color}15, transparent)` 
            }}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{value}%</div>
                  <div className="text-sm text-muted-foreground">{DISC_LABELS[key].name}</div>
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: DISC_LABELS[key].color }}
                >
                  {key.toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            Mapa Comportamental
          </CardTitle>
          <CardDescription>
            Distribuição da equipe por orientação comportamental
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  domain={[0, 100]} 
                  name="Orientação"
                  tickFormatter={() => ''}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  domain={[0, 100]} 
                  name="Energia"
                  tickFormatter={() => ''}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="z" range={[100, 400]} />
                
                {/* Reference lines for quadrants */}
                <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Scatter name="Equipe" data={data} shape="circle">
                  {data.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={DISC_LABELS[entry.dominantType].color}
                      fillOpacity={0.8}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Quadrant Labels */}
            <div className="absolute top-4 left-4 text-sm font-medium flex items-center gap-1" style={{ color: DISC_LABELS.i.color }}>
              <span>{QUADRANT_LABELS.I.emoji}</span> Influência
            </div>
            <div className="absolute top-4 right-4 text-sm font-medium flex items-center gap-1" style={{ color: DISC_LABELS.d.color }}>
              Dominância <span>{QUADRANT_LABELS.D.emoji}</span>
            </div>
            <div className="absolute bottom-4 left-4 text-sm font-medium flex items-center gap-1" style={{ color: DISC_LABELS.s.color }}>
              <span>{QUADRANT_LABELS.S.emoji}</span> Estabilidade
            </div>
            <div className="absolute bottom-4 right-4 text-sm font-medium flex items-center gap-1" style={{ color: DISC_LABELS.c.color }}>
              Conformidade <span>{QUADRANT_LABELS.C.emoji}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance & Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Equilíbrio da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div 
                className={`text-4xl font-bold ${
                  balanceScore >= 70 ? 'text-emerald-500' : 
                  balanceScore >= 40 ? 'text-amber-500' : 'text-red-500'
                }`}
              >
                {balanceScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                {balanceScore >= 70 
                  ? 'Excelente! Equipe bem diversificada.'
                  : balanceScore >= 40
                    ? 'Moderado. Considere diversificar mais.'
                    : 'Baixo. Equipe muito homogênea.'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum gap significativo identificado
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {gaps.map((gap, i) => (
                  <li key={i} className="text-muted-foreground">• {gap}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfis Mapeados ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.map((point, i) => (
              <motion.div
                key={point.profile.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Badge 
                  variant="secondary"
                  className="py-1.5 px-3"
                  style={{ 
                    borderLeft: `3px solid ${DISC_LABELS[point.dominantType].color}` 
                  }}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: DISC_LABELS[point.dominantType].color }}
                  />
                  {point.name}
                  <span className="ml-2 text-xs opacity-60">
                    {point.dominantType.toUpperCase()}
                  </span>
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
