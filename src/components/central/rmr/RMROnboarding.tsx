import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Sparkles, FileText, CheckCircle, ArrowRight, ArrowLeft, X, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface RMROnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "O que é RMR?",
    description: "A Reunião de Metas e Reconhecimento acontece todo 1º dia útil do mês. É o momento de celebrar conquistas, reconhecer quem se destacou e definir as metas do próximo período.",
    icon: Trophy,
    color: "amber",
    tips: [
      "Duração ideal: 45 minutos",
      "Realizada antes do expediente",
      "Toda a equipe de vendas participa"
    ]
  },
  {
    id: 2,
    title: "Preparando sua RMR",
    description: "Clique em 'Preparar RMR' para iniciar o wizard de configuração. Você terá um prazo de 7 dias antes da reunião para completar a preparação.",
    icon: Calendar,
    color: "blue",
    tips: [
      "O sistema calcula automaticamente o prazo",
      "Receba lembretes conforme o prazo se aproxima",
      "Todos os dados ficam salvos para consulta"
    ]
  },
  {
    id: 3,
    title: "Passos do Wizard",
    description: "O wizard guiará você em 5 passos: Resultados do mês → Escolha do Destaque → Tema e Vídeo Motivacional → Metas do próximo mês → Revisão Final.",
    icon: Sparkles,
    color: "violet",
    tips: [
      "A IRIS sugere destaques com base nos dados",
      "Vídeos são sugeridos conforme o tema",
      "Estratégias podem ser reaproveitadas"
    ]
  },
  {
    id: 4,
    title: "Roteiro Automático",
    description: "Após salvar a RMR, a IRIS gera automaticamente um roteiro completo de 45 minutos com falas sugeridas para cada seção da reunião.",
    icon: FileText,
    color: "emerald",
    tips: [
      "Roteiro estruturado em 4 seções principais",
      "Falas sugeridas para o apresentador",
      "Pode ser baixado como PDF"
    ]
  },
  {
    id: 5,
    title: "Você está pronto!",
    description: "Agora você sabe como funciona a RMR. Clique em 'Preparar RMR' para começar sua primeira reunião ou explore os materiais disponíveis.",
    icon: CheckCircle,
    color: "emerald",
    tips: [
      "O histórico fica salvo para consulta",
      "Métricas de sucesso são calculadas automaticamente",
      "Você pode regenerar o roteiro quando quiser"
    ]
  }
];

const RMROnboarding = ({ isOpen, onClose, onComplete }: RMROnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as seen in localStorage
    localStorage.setItem("rmr-onboarding-seen", "true");
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("rmr-onboarding-seen", "true");
    onClose();
  };

  const step = ONBOARDING_STEPS[currentStep - 1];
  const StepIcon = step.icon;
  const progress = (currentStep / ONBOARDING_STEPS.length) * 100;

  const colorClasses: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    amber: {
      bg: "from-amber-500/10 to-transparent",
      border: "border-amber-500/20",
      text: "text-amber-500",
      iconBg: "bg-amber-500/10"
    },
    blue: {
      bg: "from-blue-500/10 to-transparent",
      border: "border-blue-500/20",
      text: "text-blue-500",
      iconBg: "bg-blue-500/10"
    },
    violet: {
      bg: "from-violet-500/10 to-transparent",
      border: "border-violet-500/20",
      text: "text-violet-500",
      iconBg: "bg-violet-500/10"
    },
    emerald: {
      bg: "from-emerald-500/10 to-transparent",
      border: "border-emerald-500/20",
      text: "text-emerald-500",
      iconBg: "bg-emerald-500/10"
    }
  };

  const colors = colorClasses[step.color];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden" hideCloseButton>
        <VisuallyHidden>
          <DialogTitle>Guia da RMR</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Guia da RMR</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Passo {currentStep} de {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Icon and Title */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={`inline-flex p-4 rounded-full ${colors.iconBg}`}
                >
                  <StepIcon className={`h-12 w-12 ${colors.text}`} />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
              </div>

              {/* Description */}
              <p className="text-center text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Tips */}
              <div className={`p-4 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
                <ul className="space-y-2">
                  {step.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 mt-0.5 ${colors.text} flex-shrink-0`} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentStep < ONBOARDING_STEPS.length && (
              <Button variant="ghost" onClick={handleSkip}>
                Pular
              </Button>
            )}
            <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600">
              {currentStep === ONBOARDING_STEPS.length ? (
                <>
                  Começar
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RMROnboarding;
