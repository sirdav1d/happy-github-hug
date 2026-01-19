import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Users, Target, Mic, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface RMRGenerationProgressProps {
  isOpen: boolean;
  onComplete?: () => void;
}

const GENERATION_STEPS = [
  { id: 1, label: "Analisando dados da equipe...", icon: Users, progressTo: 20 },
  { id: 2, label: "Gerando abertura e contexto...", icon: FileText, progressTo: 40 },
  { id: 3, label: "Criando seção de reconhecimento...", icon: Sparkles, progressTo: 60 },
  { id: 4, label: "Definindo metas e estratégias...", icon: Target, progressTo: 80 },
  { id: 5, label: "Finalizando roteiro...", icon: Mic, progressTo: 95 },
];

const RMRGenerationProgress = ({ isOpen, onComplete }: RMRGenerationProgressProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset on close
      setCurrentStepIndex(0);
      setProgress(0);
      return;
    }

    // Simulate progress through steps
    const stepDuration = 5000; // 5 seconds per step average
    const intervalTime = 100;
    const totalSteps = GENERATION_STEPS.length;
    const progressPerTick = 100 / (stepDuration * totalSteps / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + progressPerTick;
        
        // Update current step based on progress
        const newStepIndex = GENERATION_STEPS.findIndex(
          (step, idx) => nextProgress < step.progressTo
        );
        if (newStepIndex !== -1 && newStepIndex !== currentStepIndex) {
          setCurrentStepIndex(newStepIndex);
        }
        
        if (nextProgress >= 100) {
          clearInterval(interval);
          onComplete?.();
          return 100;
        }
        return nextProgress;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, onComplete, currentStepIndex]);

  const currentStep = GENERATION_STEPS[currentStepIndex] || GENERATION_STEPS[0];
  const StepIcon = currentStep.icon;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <VisuallyHidden>
          <DialogTitle>Gerando Roteiro</DialogTitle>
        </VisuallyHidden>
        <div className="space-y-6 py-4">
          {/* Animated IRIS Icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-amber-500/30">
                <Sparkles className="h-12 w-12 text-amber-500" />
              </div>
              {/* Glow effect */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl"
              />
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              IRIS está gerando seu roteiro
            </h3>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto criamos um roteiro personalizado para sua RMR
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span>~30 segundos</span>
            </div>
          </div>

          {/* Current Step */}
          <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-secondary/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <StepIcon className="h-5 w-5 text-amber-500" />
                </motion.div>
                <span className="text-sm font-medium">{currentStep.label}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-center gap-2">
            {GENERATION_STEPS.map((step, idx) => (
              <motion.div
                key={step.id}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx < currentStepIndex
                    ? "bg-emerald-500"
                    : idx === currentStepIndex
                    ? "bg-amber-500"
                    : "bg-muted"
                }`}
                animate={idx === currentStepIndex ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RMRGenerationProgress;
