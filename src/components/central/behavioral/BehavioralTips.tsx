import { motion } from 'framer-motion';
import { MessageCircle, Lightbulb, AlertTriangle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DISCScores } from '@/types/behavioral';
import { getDominantDISC } from './DISCBadge';

interface BehavioralTipsProps {
  discScores: DISCScores;
  salespersonName: string;
  className?: string;
}

interface DISCTipsConfig {
  feedbackStyle: string[];
  communicationDos: string[];
  communicationDonts: string[];
  motivators: string[];
  color: string;
  bgColor: string;
  fullLabel: string;
}

const DISC_TIPS: Record<keyof DISCScores, DISCTipsConfig> = {
  d: {
    fullLabel: 'Dominância',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    feedbackStyle: [
      'Seja direto e objetivo, sem rodeios',
      'Foque nos resultados e impacto no negócio',
      'Apresente desafios como oportunidades de conquista'
    ],
    communicationDos: [
      'Ir direto ao ponto',
      'Apresentar dados concretos',
      'Dar autonomia nas decisões'
    ],
    communicationDonts: [
      'Evitar detalhes desnecessários',
      'Não questionar a competência',
      'Não controlar excessivamente'
    ],
    motivators: [
      'Desafios e metas ambiciosas',
      'Reconhecimento por resultados',
      'Autoridade e autonomia'
    ]
  },
  i: {
    fullLabel: 'Influência',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    feedbackStyle: [
      'Comece com algo positivo, mantenha o tom leve',
      'Permita que compartilhe suas ideias e histórias',
      'Celebre as conquistas publicamente'
    ],
    communicationDos: [
      'Ser entusiasta e expressivo',
      'Dar espaço para socialização',
      'Reconhecer contribuições publicamente'
    ],
    communicationDonts: [
      'Evitar reuniões muito formais',
      'Não ignorar suas ideias',
      'Não ser excessivamente crítico'
    ],
    motivators: [
      'Reconhecimento social',
      'Ambiente colaborativo',
      'Liberdade para inovar'
    ]
  },
  s: {
    fullLabel: 'Estabilidade',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    feedbackStyle: [
      'Dê tempo para processar, sem pressionar',
      'Demonstre segurança e consistência',
      'Valorize a lealdade e o trabalho em equipe'
    ],
    communicationDos: [
      'Ser paciente e acolhedor',
      'Explicar mudanças com antecedência',
      'Oferecer suporte contínuo'
    ],
    communicationDonts: [
      'Evitar mudanças bruscas',
      'Não apressar decisões',
      'Não criar ambiente de conflito'
    ],
    motivators: [
      'Segurança e estabilidade',
      'Relacionamentos de confiança',
      'Ambiente harmonioso'
    ]
  },
  c: {
    fullLabel: 'Conformidade',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    feedbackStyle: [
      'Baseie-se em dados e fatos específicos',
      'Seja preciso e bem estruturado',
      'Dê tempo para análise antes de cobrar ação'
    ],
    communicationDos: [
      'Fornecer informações detalhadas',
      'Seguir processos estabelecidos',
      'Dar feedback por escrito'
    ],
    communicationDonts: [
      'Evitar generalizações',
      'Não pedir decisões impulsivas',
      'Não ignorar procedimentos'
    ],
    motivators: [
      'Precisão e qualidade',
      'Processos bem definidos',
      'Tempo para análise'
    ]
  }
};

export function BehavioralTips({ discScores, salespersonName, className }: BehavioralTipsProps) {
  const dominant = getDominantDISC(discScores);
  const tips = DISC_TIPS[dominant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={cn("border", tips.bgColor)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className={cn("h-4 w-4", tips.color)} />
            <span>Dicas de Comunicação para {salespersonName.split(' ')[0]}</span>
            <Badge variant="outline" className={cn("ml-auto text-[10px]", tips.color)}>
              {tips.fullLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Feedback Style */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-medium text-foreground">Como dar feedback</span>
            </div>
            <ul className="space-y-1">
              {tips.feedbackStyle.map((tip, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className={tips.color}>•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Communication Tips */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] font-medium text-emerald-600 mb-1.5">✓ Fazer</p>
              <ul className="space-y-0.5">
                {tips.communicationDos.map((tip, idx) => (
                  <li key={idx} className="text-[11px] text-muted-foreground">• {tip}</li>
                ))}
              </ul>
            </div>
            <div className="p-2 rounded bg-rose-500/5 border border-rose-500/10">
              <p className="text-[10px] font-medium text-rose-600 mb-1.5">✗ Evitar</p>
              <ul className="space-y-0.5">
                {tips.communicationDonts.map((tip, idx) => (
                  <li key={idx} className="text-[11px] text-muted-foreground">• {tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Motivators */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-xs font-medium text-foreground">O que motiva</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tips.motivators.map((motivator, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-[10px] bg-muted/50"
                >
                  {motivator}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default BehavioralTips;
