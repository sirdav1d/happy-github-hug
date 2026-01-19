import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Calendar, 
  BarChart3, 
  Lightbulb, 
  Trophy,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  TrendingUp,
  Zap,
  Award
} from 'lucide-react';

interface JourneyOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 'intro',
    title: 'O que é a Jornada de Mentoria?',
    description: 'Acompanhe sua evolução durante os 6 meses do programa de mentoria. Visualize seu progresso, desbloqueie conquistas e veja projeções inteligentes do seu resultado final.',
    icon: Sparkles,
    color: 'text-primary',
    tips: [
      'Acompanhamento automático do seu progresso',
      'Visualização mês a mês da evolução',
      'Conquistas para celebrar vitórias',
    ],
  },
  {
    id: 'timeline',
    title: 'A Timeline Visual',
    description: 'Cada círculo representa um mês da sua jornada. As cores e ícones mostram seu desempenho em relação à meta mensal.',
    icon: Calendar,
    color: 'text-emerald-500',
    tips: [
      '🟢 Verde = Meta batida com sucesso',
      '🟡 Âmbar = Abaixo da meta (oportunidade)',
      '🔥 Fogo = Streak - meses consecutivos de sucesso',
      '🎯 Alvo = Mês atual em andamento',
    ],
  },
  {
    id: 'metrics',
    title: 'Métricas de Evolução',
    description: 'Indicadores calculados automaticamente para você entender sua performance de forma objetiva.',
    icon: BarChart3,
    color: 'text-blue-500',
    tips: [
      '🎯 Metas Batidas: quantos meses você atingiu a meta',
      '⚡ Streak: sequência de meses consecutivos batendo meta',
      '📈 Crescimento: evolução desde o início da mentoria',
      '🏅 Consistência: regularidade do seu faturamento',
    ],
  },
  {
    id: 'projection',
    title: 'Projeção Inteligente',
    description: 'O sistema analisa seu histórico e tendência para projetar seu resultado ao final dos 6 meses.',
    icon: Lightbulb,
    color: 'text-amber-500',
    tips: [
      'Projeção do faturamento no final da jornada',
      'Probabilidade de sucesso calculada automaticamente',
      'Crescimento total projetado baseado na tendência',
      'Mensagens de orientação personalizadas',
    ],
  },
  {
    id: 'achievements',
    title: 'Conquistas e Gamificação',
    description: 'Desbloqueie badges ao atingir marcos importantes. Cada conquista celebra um passo na sua evolução!',
    icon: Trophy,
    color: 'text-yellow-500',
    tips: [
      '🏆 Primeira Meta: bata sua primeira meta mensal',
      '🔥 On Fire: mantenha um streak de 3 meses',
      '📈 Crescimento 50%: cresça 50% desde o início',
      '⭐ Consistente: mantenha consistência acima de 80%',
    ],
  },
];

const JourneyOnboarding: React.FC<JourneyOnboardingProps> = ({ 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('journey-onboarding-seen', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('journey-onboarding-seen', 'true');
    onClose();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-lg overflow-hidden"
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding da Jornada de Mentoria</DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Progress Indicator */}
          <div className="flex gap-1.5 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
                initial={false}
                animate={{ 
                  scale: index === currentStep ? 1 : 0.95,
                  opacity: index <= currentStep ? 1 : 0.5 
                }}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Icon & Title */}
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className={`p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10`}
                >
                  <StepIcon className={`w-6 h-6 ${step.color}`} />
                </motion.div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Passo {currentStep + 1} de {ONBOARDING_STEPS.length}
                  </p>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Tips */}
              <div className="space-y-2 pt-2">
                {step.tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Pular tour
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
              
              {isLastStep ? (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="gap-1 bg-primary hover:bg-primary/90"
                >
                  Começar!
                  <Sparkles className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyOnboarding;
