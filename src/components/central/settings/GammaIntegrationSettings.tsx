import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, CheckCircle, Loader2, ExternalLink, Trash2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGammaSlides } from "@/hooks/useGammaSlides";
import { GammaSetupWizard } from "./GammaSetupWizard";
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

export function GammaIntegrationSettings() {
  const {
    hasGammaConfigured,
    isLoadingKey,
    validateApiKey,
    saveApiKey,
    isSavingKey,
    removeApiKey,
  } = useGammaSlides();

  const [showWizard, setShowWizard] = useState(false);

  const handleWizardComplete = (apiKey: string) => {
    saveApiKey(apiKey);
    setShowWizard(false);
  };

  if (isLoadingKey) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="gamma-integration" className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Integrações</CardTitle>
          </div>
        </div>
        <CardDescription>Conecte serviços externos para recursos avançados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gamma.app Section */}
        <div className="p-4 rounded-lg border border-border bg-secondary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">γ</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Gamma.app</h4>
                <p className="text-sm text-muted-foreground">
                  Apresentações com IA para RMR
                </p>
              </div>
            </div>
            {hasGammaConfigured ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Não configurado
              </Badge>
            )}
          </div>

          <AnimatePresence mode="wait">
            {hasGammaConfigured ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">
                  Sua integração com o Gamma está ativa. Você pode gerar apresentações 
                  profissionais com IA diretamente na seção de materiais da RMR.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://gamma.app/docs", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver documentação
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar Gamma?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sua API Key será removida e você não poderá mais gerar 
                          apresentações com o Gamma até configurar novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={removeApiKey}>
                          Desconectar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ) : showWizard ? (
              <motion.div
                key="wizard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GammaSetupWizard
                  onComplete={handleWizardComplete}
                  onCancel={() => setShowWizard(false)}
                  validateApiKey={validateApiKey}
                  isSaving={isSavingKey}
                />
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
                  <div className="flex items-start gap-3">
                    <Wand2 className="h-5 w-5 text-violet-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Crie apresentações incríveis com IA
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        O Gamma transforma os dados da sua RMR em slides profissionais 
                        automaticamente. Economize horas de trabalho a cada reunião.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">30s</p>
                    <p className="text-xs text-muted-foreground">para gerar</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">∞</p>
                    <p className="text-xs text-muted-foreground">layouts</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">1</p>
                    <p className="text-xs text-muted-foreground">clique</p>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                  onClick={() => setShowWizard(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Configurar Gamma
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
