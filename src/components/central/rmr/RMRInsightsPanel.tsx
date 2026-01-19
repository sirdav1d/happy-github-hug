import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Lightbulb, 
  Check, 
  Lock,
  ChevronRight,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { HighlightCandidate } from '@/hooks/useRMRPreparation';

interface RMRInsightsPanelProps {
  highlightCandidates: HighlightCandidate[];
  suggestedTheme?: string;
  themeContext?: string;
  suggestedStrategies?: string[];
  suggestedGoal?: number;
  goalReasoning?: string;
  isPhase2: boolean;
  onSelectHighlight?: (candidate: HighlightCandidate) => void;
  onSelectTheme?: (theme: string) => void;
  onSelectStrategies?: (strategies: string[]) => void;
  selectedHighlightId?: string;
  isLoading?: boolean;
}

export const RMRInsightsPanel: React.FC<RMRInsightsPanelProps> = ({
  highlightCandidates,
  suggestedTheme,
  themeContext,
  suggestedStrategies = [],
  suggestedGoal,
  goalReasoning,
  isPhase2,
  onSelectHighlight,
  onSelectTheme,
  onSelectStrategies,
  selectedHighlightId,
  isLoading = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const LockedOverlay = ({ message }: { message: string }) => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
      <div className="text-center p-4">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Badge variant="secondary" className="mt-2">
          Fase 2: Automatizado
        </Badge>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="text-sm text-muted-foreground">
            IRIS está analisando sua equipe...
          </span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Sugestões da IRIS</h3>
        {!isPhase2 && (
          <Badge variant="secondary" className="ml-auto">
            <Lock className="h-3 w-3 mr-1" />
            Visualização
          </Badge>
        )}
      </div>

      {/* Highlight Candidates */}
      {highlightCandidates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Candidatos a Destaque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative">
            {!isPhase2 && <LockedOverlay message="Seleção disponível na Fase 2" />}
            
            <AnimatePresence>
              {highlightCandidates.map((candidate, index) => (
                <motion.div
                  key={candidate.employee_id || candidate.employee_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer",
                    selectedHighlightId === candidate.employee_id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                  onClick={() => isPhase2 && onSelectHighlight?.(candidate)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        index === 0 ? "bg-amber-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        "bg-amber-700 text-white"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{candidate.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-primary">{candidate.score}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </div>
                  </div>
                  
                  {candidate.metrics && (
                    <div className="mt-2 pt-2 border-t grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Faturamento</span>
                        <p className="font-medium">{formatCurrency(candidate.metrics.revenue)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Atingimento</span>
                        <p className="font-medium">{candidate.metrics.achievement?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Crescimento</span>
                        <p className={cn(
                          "font-medium",
                          (candidate.metrics.growth || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {(candidate.metrics.growth || 0) >= 0 ? '+' : ''}{candidate.metrics.growth}%
                        </p>
                      </div>
                    </div>
                  )}

                  {isPhase2 && selectedHighlightId === candidate.employee_id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-3"
                    >
                      <Check className="h-5 w-5 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Suggested Theme */}
      {suggestedTheme && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Tema Motivacional Sugerido
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {!isPhase2 && <LockedOverlay message="Seleção disponível na Fase 2" />}
            
            <div 
              className={cn(
                "p-4 rounded-lg border-2 border-dashed transition-all",
                isPhase2 ? "cursor-pointer hover:border-primary hover:bg-primary/5" : "",
                "border-primary/30 bg-primary/5"
              )}
              onClick={() => isPhase2 && onSelectTheme?.(suggestedTheme)}
            >
              <p className="text-lg font-semibold text-center mb-2">
                "{suggestedTheme}"
              </p>
              {themeContext && (
                <p className="text-sm text-muted-foreground text-center">
                  {themeContext}
                </p>
              )}
              {isPhase2 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTheme?.(suggestedTheme);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Usar este tema
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Strategies */}
      {suggestedStrategies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Estratégias Sugeridas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative">
            {!isPhase2 && <LockedOverlay message="Seleção disponível na Fase 2" />}
            
            {suggestedStrategies.map((strategy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50"
              >
                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{strategy}</span>
              </motion.div>
            ))}
            
            {isPhase2 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => onSelectStrategies?.(suggestedStrategies)}
              >
                <Check className="h-4 w-4 mr-2" />
                Usar estas estratégias
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggested Goal */}
      {suggestedGoal && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Meta Sugerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(suggestedGoal)}
              </p>
              {goalReasoning && (
                <p className="text-sm text-muted-foreground mt-2">
                  {goalReasoning}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2 CTA */}
      {!isPhase2 && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Desbloqueie o poder total da IRIS</p>
              <p className="text-xs text-muted-foreground mt-1">
                Na Fase 2, você pode selecionar sugestões com um clique, 
                gerar roteiros automáticos e muito mais!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RMRInsightsPanel;
