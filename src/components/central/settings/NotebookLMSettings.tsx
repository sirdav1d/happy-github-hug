import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headphones, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Shield,
  Unplug,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNotebookLM } from "@/hooks/useNotebookLM";
import { NotebookLMSetupWizard } from "./NotebookLMSetupWizard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotebookLMSettings() {
  const {
    config,
    isLoading,
    isConfigured,
    saveCredentials,
    validateCredentials,
    disconnectNotebookLM,
  } = useNotebookLM();

  const [showWizard, setShowWizard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    
    const result = await validateCredentials();
    setValidationResult(result);
    
    setIsValidating(false);
  };

  const handleWizardComplete = async (projectId: string, location: string, serviceAccountJson: string): Promise<boolean> => {
    setIsSaving(true);
    const success = await saveCredentials(projectId, location, serviceAccountJson);
    
    if (success) {
      setShowWizard(false);
    }
    
    setIsSaving(false);
    return success;
  };

  const handleDisconnect = async () => {
    await disconnectNotebookLM();
    setValidationResult(null);
  };

  const formatConnectedDate = () => {
    if (!config?.connectedAt) return null;
    try {
      return format(new Date(config.connectedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  return (
    <Card id="notebooklm-integration" className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                NotebookLM Enterprise
                <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/30">
                  Premium
                </Badge>
              </CardTitle>
              <CardDescription>
                Gere podcasts e briefings de reunião com IA do Google
              </CardDescription>
            </div>
          </div>
          {isConfigured && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="space-y-4">
            {/* Connected State */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">NotebookLM configurado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Projeto GCP: <code className="bg-secondary px-1 rounded">{config?.projectId}</code>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Região: <code className="bg-secondary px-1 rounded">{config?.location}</code>
                  </p>
                  {formatConnectedDate() && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Conectado em {formatConnectedDate()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleValidate}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Unplug className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desconectar NotebookLM?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá suas credenciais do Google Cloud. Você precisará configurá-las novamente para usar o NotebookLM.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect}>
                      Desconectar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Validation Result */}
            <AnimatePresence>
              {validationResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    validationResult.valid
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {validationResult.valid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{validationResult.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Documentation Link */}
            <a
              href="https://cloud.google.com/discovery-engine/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Documentação do Discovery Engine API
            </a>
          </div>
        ) : showWizard ? (
          <NotebookLMSetupWizard
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
            isSubmitting={isSaving}
          />
        ) : (
          <div className="space-y-4">
            {/* Welcome Card */}
            <div className="p-6 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 text-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-600 w-fit mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Gere Podcasts e Briefings com IA
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Transforme seus dados de reunião em áudio estilo podcast, 
                briefings executivos e FAQs automáticos usando o Google NotebookLM.
              </p>
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Configurar NotebookLM
              </Button>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { emoji: "🎙️", title: "Podcast", desc: "Áudio com discussão natural" },
                { emoji: "📋", title: "Briefing", desc: "Resumo executivo" },
                { emoji: "❓", title: "FAQ", desc: "Perguntas e respostas" },
              ].map((feature) => (
                <div key={feature.title} className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <span className="text-2xl">{feature.emoji}</span>
                  <p className="font-medium text-foreground text-sm mt-1">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
