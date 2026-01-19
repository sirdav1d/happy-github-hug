import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CreditCard,
  Key,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Presentation,
  Zap,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GammaSetupWizardProps {
  onComplete: (apiKey: string) => void;
  onCancel: () => void;
  validateApiKey: (apiKey: string) => Promise<{ valid: boolean; error?: string }>;
  isSaving: boolean;
}

const STEPS = [
  {
    id: 1,
    title: "Conhecer o Gamma",
    description: "Entenda o que é o Gamma",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Plano Pro",
    description: "Requisitos para usar a API",
    icon: CreditCard,
  },
  {
    id: 3,
    title: "Conectar",
    description: "Configure sua API Key",
    icon: Key,
  },
];

export function GammaSetupWizard({
  onComplete,
  onCancel,
  validateApiKey,
  isSaving,
}: GammaSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const canProceed = (step: number): boolean => {
    if (step < 3) {
      return completedSteps.includes(step);
    }
    // Step 3: need valid API key
    return validationResult?.valid === true;
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    const result = await validateApiKey(apiKey.trim());
    setValidationResult(result);
    setIsValidating(false);
  };

  const handleSubmit = () => {
    if (!validationResult?.valid || !apiKey.trim()) return;
    onComplete(apiKey.trim());
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                O que é o Gamma?
              </h4>
              <p className="text-sm text-muted-foreground">
                O Gamma é uma plataforma de IA que cria apresentações profissionais 
                automaticamente. Com um clique, você transforma dados da sua RMR em 
                slides prontos para apresentar à equipe.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Presentation className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Design Profissional</p>
                  <p className="text-xs text-muted-foreground">
                    Layouts modernos criados automaticamente pela IA
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Geração Instantânea</p>
                  <p className="text-xs text-muted-foreground">
                    Apresentações prontas em segundos, não horas
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Video className="h-5 w-5 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Vídeos Incorporados</p>
                  <p className="text-xs text-muted-foreground">
                    Inclui automaticamente os vídeos motivacionais da RMR
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open("https://gamma.app/signup", "_blank")}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Criar conta no Gamma
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={completedSteps.includes(1)}
                onChange={(e) => {
                  if (e.target.checked) handleStepComplete(1);
                  else setCompletedSteps(completedSteps.filter((s) => s !== 1));
                }}
                className="h-5 w-5 rounded border-border"
              />
              <span className="text-sm">Já tenho uma conta no Gamma</span>
            </label>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-500" />
                Plano Pro Necessário
              </h4>
              <p className="text-sm text-muted-foreground">
                O acesso à API do Gamma requer um plano Pro ou superior. 
                Isso permite a geração automática de apresentações.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <h4 className="font-medium text-foreground text-sm">Comparação de Planos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Free</span>
                  <span className="text-muted-foreground">Sem acesso à API</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-foreground font-medium">Pro</span>
                  <span className="text-emerald-500 font-medium">✓ API Liberada</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-600 font-medium">
                🎁 Muitas contas já incluem API no plano – verifique o seu!
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open("https://gamma.app/pricing", "_blank")}
            >
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Ver planos do Gamma
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={completedSteps.includes(2)}
                onChange={(e) => {
                  if (e.target.checked) handleStepComplete(2);
                  else setCompletedSteps(completedSteps.filter((s) => s !== 2));
                }}
                className="h-5 w-5 rounded border-border"
              />
              <span className="text-sm">Já tenho o plano Pro (ou acesso à API)</span>
            </label>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">Onde encontrar sua API Key?</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse as configurações do Gamma</li>
                <li>Navegue até a seção "API"</li>
                <li>Clique em "Create new API key"</li>
                <li>Copie a chave gerada (começa com <code className="bg-secondary px-1 rounded text-xs">sk-gamma-</code>)</li>
              </ol>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open("https://gamma.app/settings/api", "_blank")}
            >
              <span className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Abrir Configurações de API
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <Label htmlFor="gamma-api-key-wizard">Sua API Key</Label>
              <div className="relative">
                <Input
                  id="gamma-api-key-wizard"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="sk-gamma-xxxxxxxxxxxxxxxx"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {validationResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    validationResult.valid
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  )}
                >
                  {validationResult.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Conexão validada com sucesso!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>{validationResult.error || "API Key inválida"}</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleTestConnection}
              disabled={!apiKey.trim() || isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando conexão...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = completedSteps.includes(step.id) || (step.id === 3 && validationResult?.valid);
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2",
                    completedSteps.includes(step.id) ? "bg-emerald-500" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep === 1) {
              onCancel();
            } else {
              setCurrentStep(currentStep - 1);
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {currentStep < 3 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed(currentStep)}>
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed(3) || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conectar Gamma
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
