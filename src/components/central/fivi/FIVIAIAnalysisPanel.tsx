import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { BehavioralTips } from "../behavioral/BehavioralTips";
import { StressIndicator } from "../behavioral/StressIndicator";
import type { DISCScores } from "@/types/behavioral";

export interface SentimentIndicator {
  type: string;
  evidence: string;
  weight: number;
}

export interface SentimentAnalysis {
  overall: 'confiante' | 'neutro' | 'inseguro' | 'frustrado' | 'entusiasmado';
  score: number;
  indicators: SentimentIndicator[];
  evolutionVsPrevious?: 'melhora' | 'estável' | 'declínio';
}

export interface KeyPoints {
  conquistas: string[];
  desafios: string[];
  oportunidades: string[];
  acoes_sugeridas: string[];
}

export interface AIAnalysis {
  transcription: string;
  summary: string;
  sentiment: SentimentAnalysis;
  commitments: string[];
  concerns: string[];
  confidenceScore: number;
  keyPoints: KeyPoints;
}

interface BehavioralProfileData {
  discNatural?: DISCScores | null;
  discAdapted?: DISCScores | null;
}

interface FIVIAIAnalysisPanelProps {
  analysis: AIAnalysis;
  onReprocess?: () => void;
  isReprocessing?: boolean;
  isHistoryView?: boolean;
  className?: string;
  salespersonName?: string;
  behavioralProfile?: BehavioralProfileData | null;
  showBehavioralTips?: boolean;
}

const sentimentConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  confiante: { label: 'Confiante', color: 'text-emerald-500', bgColor: 'bg-emerald-500' },
  entusiasmado: { label: 'Entusiasmado', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  neutro: { label: 'Neutro', color: 'text-slate-500', bgColor: 'bg-slate-500' },
  inseguro: { label: 'Inseguro', color: 'text-amber-500', bgColor: 'bg-amber-500' },
  frustrado: { label: 'Frustrado', color: 'text-rose-500', bgColor: 'bg-rose-500' },
};

const evolutionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  melhora: { icon: TrendingUp, color: 'text-emerald-500', label: 'Melhora' },
  estável: { icon: Minus, color: 'text-slate-500', label: 'Estável' },
  declínio: { icon: TrendingDown, color: 'text-rose-500', label: 'Declínio' },
};

const FIVIAIAnalysisPanel = ({ 
  analysis, 
  onReprocess, 
  isReprocessing = false,
  isHistoryView = false,
  className,
  salespersonName,
  behavioralProfile,
  showBehavioralTips = true
}: FIVIAIAnalysisPanelProps) => {
  const [showTranscription, setShowTranscription] = useState(false);

  const sentiment = sentimentConfig[analysis.sentiment.overall] || sentimentConfig.neutro;
  const evolution = analysis.sentiment.evolutionVsPrevious 
    ? evolutionConfig[analysis.sentiment.evolutionVsPrevious] 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      <Card className="bg-gradient-to-br from-violet-500/5 via-card to-card border-violet-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Brain className="h-5 w-5 text-violet-500" />
              </div>
              Análise IRIS
            </CardTitle>
            {onReprocess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReprocess}
                disabled={isReprocessing}
                className="gap-2 text-muted-foreground"
              >
                <RefreshCw className={cn("h-4 w-4", isReprocessing && "animate-spin")} />
                {isReprocessing ? 'Processando...' : 'Reprocessar'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Confidence Score */}
          <div className="p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Confiança do Vendedor
              </span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("border-none", sentiment.color, sentiment.bgColor + '/10')}
                >
                  {sentiment.label}
                </Badge>
                {evolution && (
                  <div className={cn("flex items-center gap-1 text-xs", evolution.color)}>
                    <evolution.icon className="h-3 w-3" />
                    <span>{evolution.label}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Progress 
                  value={analysis.confidenceScore} 
                  className="flex-1 h-3"
                />
                <span className="ml-3 text-lg font-bold text-foreground">
                  {analysis.confidenceScore}/100
                </span>
              </div>
            </div>

            {/* Sentiment indicators */}
            {analysis.sentiment.indicators.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Indicadores:</p>
                {analysis.sentiment.indicators.slice(0, 3).map((indicator, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-background/50"
                  >
                    <div 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                        indicator.weight > 0.5 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    <div className="min-w-0">
                      <span className="font-medium">{indicator.type}</span>
                      <p className="text-muted-foreground text-xs truncate">
                        "{indicator.evidence}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Resumo Executivo</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-secondary/30">
              {analysis.summary}
            </p>
          </div>

          {/* Commitments */}
          {analysis.commitments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">
                  Compromissos Identificados ({analysis.commitments.length})
                </span>
              </div>
              <ul className="space-y-1.5">
                {analysis.commitments.map((commitment, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-2 text-sm text-foreground p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                  >
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {commitment}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {analysis.concerns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">
                  Pontos de Atenção ({analysis.concerns.length})
                </span>
              </div>
              <ul className="space-y-1.5">
                {analysis.concerns.map((concern, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-2 text-sm text-foreground p-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
                  >
                    <span className="text-amber-500 mt-0.5">•</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Points */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium text-foreground">Pontos-Chave</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.keyPoints.conquistas.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs font-medium text-emerald-500 mb-2">Conquistas</p>
                  <ul className="space-y-1 text-sm text-foreground">
                    {analysis.keyPoints.conquistas.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.keyPoints.desafios.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <p className="text-xs font-medium text-rose-500 mb-2">Desafios</p>
                  <ul className="space-y-1 text-sm text-foreground">
                    {analysis.keyPoints.desafios.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Target className="h-3 w-3 text-rose-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.keyPoints.oportunidades.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs font-medium text-blue-500 mb-2">Oportunidades</p>
                  <ul className="space-y-1 text-sm text-foreground">
                    {analysis.keyPoints.oportunidades.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.keyPoints.acoes_sugeridas.length > 0 && (
                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <p className="text-xs font-medium text-violet-500 mb-2">Ações Sugeridas</p>
                  <ul className="space-y-1 text-sm text-foreground">
                    {analysis.keyPoints.acoes_sugeridas.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-violet-500">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Transcription (collapsible) */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowTranscription(!showTranscription)}
              className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-medium">Transcrição Completa</span>
              {showTranscription ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showTranscription && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-lg bg-secondary/30 max-h-60 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {analysis.transcription}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Insights Section */}
      {showBehavioralTips && behavioralProfile?.discNatural && salespersonName && (
        <div className="space-y-4">
          <BehavioralTips 
            discScores={behavioralProfile.discNatural} 
            salespersonName={salespersonName} 
          />
          
          {/* Stress Indicator - only show if we have both Natural and Adapted */}
          {behavioralProfile.discAdapted && (
            <StressIndicator
              natural={behavioralProfile.discNatural}
              adapted={behavioralProfile.discAdapted}
              salespersonName={salespersonName}
            />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default FIVIAIAnalysisPanel;
