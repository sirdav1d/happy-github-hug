import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, CheckCircle2, Brain, Heart, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { DISCScores, ValuesScores } from '@/types/behavioral';
import { DISC_LABELS, VALUES_LABELS } from '@/types/behavioral';
import { DISCRadarChart } from './DISCRadarChart';
import { ValuesBarChart } from './ValuesBarChart';

interface ManualProfileEntryProps {
  salespersonName: string;
  onComplete: (result: {
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    source: 'manual' | 'innermetrix';
  }) => void;
  onCancel: () => void;
}

export function ManualProfileEntry({ 
  salespersonName, 
  onComplete, 
  onCancel 
}: ManualProfileEntryProps) {
  const [discScores, setDiscScores] = useState<DISCScores>({ d: 50, i: 50, s: 50, c: 50 });
  const [valuesScores, setValuesScores] = useState<ValuesScores>({
    aesthetic: 50,
    economic: 50,
    individualist: 50,
    political: 50,
    altruistic: 50,
    regulatory: 50,
    theoretical: 50,
  });
  const [includeValues, setIncludeValues] = useState(false);

  const handleDISCChange = (key: keyof DISCScores, value: number[]) => {
    setDiscScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleValuesChange = (key: keyof ValuesScores, value: number[]) => {
    setValuesScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleSubmit = () => {
    onComplete({
      discScores,
      valuesScores: includeValues ? valuesScores : undefined,
      source: 'manual',
    });
  };

  const isValid = Object.values(discScores).every(v => v >= 0 && v <= 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-amber-600">
          <PenLine className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Entrada de Valores Conhecidos</h2>
        </div>
        <p className="text-muted-foreground">
          Perfil de: <span className="font-medium text-foreground">{salespersonName}</span>
        </p>
        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/50">
          <AlertTriangle className="w-3 h-3" />
          Uso Avançado
        </Badge>
      </div>

      {/* Info Card */}
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <strong>Use este método apenas se você já possui os valores numéricos exatos (0-100)</strong> de uma análise prévia, 
          sistema externo ou relatório impresso. Para maior precisão, prefira importar o relatório Innermetrix ou usar o questionário.
        </AlertDescription>
      </Alert>

      {/* DISC Scores */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            Perfil DISC
          </h4>
          <div className="space-y-5">
            {(Object.keys(discScores) as Array<keyof DISCScores>).map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: DISC_LABELS[key].color }}
                    />
                    {DISC_LABELS[key].name}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discScores[key]}
                    onChange={(e) => handleDISCChange(key, [parseInt(e.target.value) || 0])}
                    className="w-20 text-center"
                  />
                </div>
                <Slider
                  value={[discScores[key]]}
                  onValueChange={(v) => handleDISCChange(key, v)}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-violet-500"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Include Values Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="includeValues"
          checked={includeValues}
          onChange={(e) => setIncludeValues(e.target.checked)}
          className="h-4 w-4 rounded border-muted-foreground"
        />
        <Label htmlFor="includeValues" className="flex items-center gap-2 cursor-pointer">
          <Heart className="w-4 h-4 text-amber-500" />
          Incluir Motivadores (Values)
        </Label>
      </div>

      {/* Values Scores */}
      <AnimatePresence>
        {includeValues && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-amber-500" />
                  Motivadores
                </h4>
                <div className="space-y-4">
                  {(Object.keys(valuesScores) as Array<keyof ValuesScores>).map((key) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2 text-sm">
                          <span 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: VALUES_LABELS[key].color }}
                          />
                          {VALUES_LABELS[key].name}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={valuesScores[key]}
                          onChange={(e) => handleValuesChange(key, [parseInt(e.target.value) || 0])}
                          className="w-16 text-center text-sm h-8"
                        />
                      </div>
                      <Slider
                        value={[valuesScores[key]]}
                        onValueChange={(v) => handleValuesChange(key, v)}
                        max={100}
                        step={1}
                        className="[&_[role=slider]]:bg-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Preview */}
      <Card className="bg-muted/20 border-primary/20">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-4 flex items-center gap-2 text-primary">
            <Eye className="w-4 h-4" />
            Visualização Prévia
          </h4>
          <div className={`grid gap-6 ${includeValues ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* DISC Preview */}
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-2">Perfil DISC</p>
              <DISCRadarChart natural={discScores} size="sm" showLegend={false} />
            </div>
            
            {/* Values Preview */}
            {includeValues && (
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground mb-2 text-center">Motivadores</p>
                <ValuesBarChart values={valuesScores} size="sm" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        
        <Button onClick={handleSubmit} disabled={!isValid}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Salvar Perfil
        </Button>
      </div>
    </div>
  );
}
