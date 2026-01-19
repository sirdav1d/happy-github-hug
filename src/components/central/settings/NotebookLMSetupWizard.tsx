import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderPlus,
  CreditCard,
  Puzzle,
  UserCog,
  Upload,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  FileJson,
  AlertCircle,
  DollarSign,
  Loader2,
  X,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface NotebookLMSetupWizardProps {
  onComplete: (projectId: string, location: string, serviceAccountJson: string) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface ServiceAccountData {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  type?: string;
}

const STEPS = [
  {
    id: 1,
    title: "Criar Projeto GCP",
    description: "Crie um projeto no Google Cloud",
    icon: FolderPlus,
  },
  {
    id: 2,
    title: "Ativar Faturamento",
    description: "Configure uma conta de faturamento",
    icon: CreditCard,
  },
  {
    id: 3,
    title: "Habilitar API",
    description: "Ative a Discovery Engine API",
    icon: Puzzle,
  },
  {
    id: 4,
    title: "Criar Service Account",
    description: "Configure as credenciais de acesso",
    icon: UserCog,
  },
  {
    id: 5,
    title: "Upload Credenciais",
    description: "Faça upload do arquivo JSON",
    icon: Upload,
  },
];

const REGIONS = [
  {
    value: "us-central1",
    label: "Estados Unidos (Iowa)",
    description: "Recomendado - Menor latência",
  },
  {
    value: "europe-west1",
    label: "Europa (Bélgica)",
    description: "Para dados que precisam ficar na UE",
  },
];

export function NotebookLMSetupWizard({
  onComplete,
  onCancel,
  isSubmitting,
}: NotebookLMSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [parsedData, setParsedData] = useState<ServiceAccountData | null>(null);
  const [location, setLocation] = useState("us-central1");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const canProceed = (step: number): boolean => {
    if (step < 5) {
      return completedSteps.includes(step);
    }
    // Step 5: need valid JSON
    return !!parsedData?.project_id && !!parsedData?.client_email && !!parsedData?.private_key;
  };

  const handleFileUpload = useCallback((file: File) => {
    setJsonError(null);
    
    if (!file.name.endsWith('.json')) {
      setJsonError("Por favor, selecione um arquivo .json");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as ServiceAccountData;

        // Validate required fields
        if (parsed.type !== 'service_account') {
          setJsonError("Este arquivo não parece ser um Service Account válido");
          return;
        }

        if (!parsed.client_email || !parsed.private_key) {
          setJsonError("O arquivo está incompleto. Verifique se contém 'client_email' e 'private_key'");
          return;
        }

        if (!parsed.project_id) {
          setJsonError("O arquivo não contém 'project_id'");
          return;
        }

        setServiceAccountJson(content);
        setParsedData(parsed);
        setJsonError(null);
      } catch {
        setJsonError("Erro ao ler o arquivo. Verifique se é um JSON válido");
      }
    };

    reader.onerror = () => {
      setJsonError("Erro ao ler o arquivo");
    };

    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleSubmit = async () => {
    if (!parsedData?.project_id || !serviceAccountJson) return;
    
    const success = await onComplete(parsedData.project_id, location, serviceAccountJson);
    if (!success) {
      setJsonError("Erro ao salvar as credenciais. Tente novamente.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">O que é um Projeto GCP?</h4>
              <p className="text-sm text-muted-foreground">
                Um projeto no Google Cloud é como uma "pasta" que organiza todos os seus recursos e serviços. 
                Você precisará de um para usar o NotebookLM.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                💡 Dica
              </h4>
              <p className="text-sm text-muted-foreground">
                Use um nome descritivo como <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">minha-empresa-notebooklm</code>
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('https://console.cloud.google.com/projectcreate', '_blank')}
            >
              <span className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Criar Projeto no Google Cloud
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={completedSteps.includes(1)}
                onChange={(e) => {
                  if (e.target.checked) handleStepComplete(1);
                  else setCompletedSteps(completedSteps.filter(s => s !== 1));
                }}
                className="h-5 w-5 rounded border-border"
              />
              <span className="text-sm">Já criei meu projeto no Google Cloud</span>
            </label>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500" />
                Custos Estimados
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Geração de áudio: ~$0.01/minuto</li>
                <li>• Uma RMR típica: ~$0.10 a $0.30</li>
                <li>• Mensal (4 RMRs): ~$0.40 a $1.20</li>
              </ul>
              <p className="text-sm text-emerald-600 mt-3 font-medium">
                🎁 O Google oferece $300 de crédito grátis para novos usuários!
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              O faturamento é necessário para usar APIs do Google Cloud, mas você só será cobrado pelo uso real.
            </p>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
            >
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Configurar Faturamento
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={completedSteps.includes(2)}
                onChange={(e) => {
                  if (e.target.checked) handleStepComplete(2);
                  else setCompletedSteps(completedSteps.filter(s => s !== 2));
                }}
                className="h-5 w-5 rounded border-border"
              />
              <span className="text-sm">Já ativei o faturamento no meu projeto</span>
            </label>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">O que é a Discovery Engine API?</h4>
              <p className="text-sm text-muted-foreground">
                É a API que permite criar notebooks e gerar conteúdo com IA. 
                Você precisa habilitá-la no seu projeto.
              </p>
            </div>

            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Clique no botão abaixo para abrir a página da API</li>
              <li>Selecione seu projeto no topo da página</li>
              <li>Clique em "Ativar" ou "Enable"</li>
            </ol>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('https://console.cloud.google.com/apis/library/discoveryengine.googleapis.com', '_blank')}
            >
              <span className="flex items-center gap-2">
                <Puzzle className="h-4 w-4" />
                Habilitar Discovery Engine API
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={completedSteps.includes(3)}
                onChange={(e) => {
                  if (e.target.checked) handleStepComplete(3);
                  else setCompletedSteps(completedSteps.filter(s => s !== 3));
                }}
                className="h-5 w-5 rounded border-border"
              />
              <span className="text-sm">Já habilitei a Discovery Engine API</span>
            </label>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">O que é um Service Account?</h4>
              <p className="text-sm text-muted-foreground">
                É uma "conta de máquina" que permite que nosso sistema acesse o NotebookLM de forma segura, sem usar suas credenciais pessoais.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <h4 className="font-medium text-foreground text-sm">Passo a passo:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse a página de Service Accounts</li>
                <li>Clique em "Criar conta de serviço"</li>
                <li>Dê um nome (ex: <code className="bg-secondary px-1 rounded text-xs">notebooklm-access</code>)</li>
                <li>
                  Adicione a role: <code className="bg-secondary px-1 rounded text-xs">Discovery Engine Editor</code>
                </li>
                <li>Clique em "Concluir"</li>
                <li>Clique nos 3 pontinhos → "Gerenciar chaves"</li>
                <li>Adicionar chave → Criar nova chave → JSON</li>
                <li>O arquivo será baixado automaticamente</li>
              </ol>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('https://console.cloud.google.com/iam-admin/serviceaccounts', '_blank')}
            >
              <span className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Criar Service Account
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={completedSteps.includes(4)}
                onChange={(e) => {
                  if (e.target.checked) handleStepComplete(4);
                  else setCompletedSteps(completedSteps.filter(s => s !== 4));
                }}
                className="h-5 w-5 rounded border-border"
              />
              <span className="text-sm">Já criei meu Service Account e baixei a chave JSON</span>
            </label>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-primary bg-primary/5"
                  : parsedData
                    ? "border-emerald-500 bg-emerald-500/5"
                    : jsonError
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {parsedData ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <p className="font-medium text-foreground">Arquivo carregado!</p>
                  <p className="text-sm text-muted-foreground">
                    Project ID detectado: <code className="bg-secondary px-1.5 py-0.5 rounded">{parsedData.project_id}</code>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setServiceAccountJson("");
                      setParsedData(null);
                      setJsonError(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileJson className={cn(
                    "h-10 w-10 mx-auto",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-medium text-foreground">
                    {isDragging ? "Solte o arquivo aqui" : "Arraste o arquivo JSON aqui"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou clique para selecionar
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {jsonError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{jsonError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Region Selection */}
            {parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="region" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Região do Servidor
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        <div className="flex flex-col">
                          <span>{region.label}</span>
                          <span className="text-xs text-muted-foreground">{region.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Security Note */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-lg leading-none">🔒</span>
                <span>
                  Suas credenciais são criptografadas e armazenadas de forma segura. 
                  Nunca compartilhamos com terceiros.
                </span>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  // Allow going back to previous steps
                  if (step.id < currentStep || completedSteps.includes(step.id - 1) || step.id === 1) {
                    setCurrentStep(step.id);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                  isActive && "bg-primary/10",
                  (step.id < currentStep || completedSteps.includes(step.id - 1) || step.id === 1)
                    ? "cursor-pointer hover:bg-muted/50"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </button>
              
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-1",
                    completedSteps.includes(step.id)
                      ? "bg-emerald-500"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Header */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="shrink-0">
          Etapa {currentStep} de {STEPS.length}
        </Badge>
        <div>
          <h3 className="font-semibold text-foreground">{STEPS[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
        </div>
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
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep(currentStep - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed(currentStep)}
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed(5) || isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conectar NotebookLM
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
