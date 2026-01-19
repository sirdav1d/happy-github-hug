import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2, Sparkles, CheckCircle, Clock, Play, ExternalLink, RefreshCw, Presentation, Settings, Headphones, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRMRScript } from "@/hooks/useRMRScript";
import { RMRMeeting, useRMR } from "@/hooks/useRMR";
import { Salesperson, ViewState, NavigationOptions } from "@/types";
import RMRScriptPreview from "./RMRScriptPreview";
import RMRGenerationProgress from "./RMRGenerationProgress";
import PhaseGatedFeature from "./PhaseGatedFeature";
import { format } from "date-fns";
import { useRMRSlides } from "@/hooks/useRMRSlides";
import { useGammaSlides } from "@/hooks/useGammaSlides";
import { useNotebookLM } from "@/hooks/useNotebookLM";
import useWhitelabel from "@/hooks/useWhitelabel";

interface RMRMaterialsSectionProps {
  rmr: RMRMeeting;
  team: Salesperson[];
  isPhase2: boolean;
  companyName?: string;
  onNavigate?: (view: ViewState, options?: NavigationOptions) => void;
}

const RMRMaterialsSection = ({ rmr, team, isPhase2, companyName, onNavigate }: RMRMaterialsSectionProps) => {
  const { 
    generateScript, 
    downloadPDF, 
    isGenerating, 
    isDownloading, 
    storedScript, 
    hasValidScript,
    scriptGeneratedAt,
    scriptMonth,
    scriptYear
  } = useRMRScript();
  const { generateSlides, isGenerating: isGeneratingSlides } = useRMRSlides();
  const { 
    hasGammaConfigured, 
    isGenerating: isGeneratingGamma, 
    generateGammaSlides,
    generationProgress: gammaProgress 
  } = useGammaSlides();
  
  const {
    isConfigured: hasNotebookLMConfigured,
    isGenerating: isGeneratingNotebookLM,
    generationProgress: notebookLMProgress,
    generatePremiumKit,
  } = useNotebookLM();
  
  const { updateRMR } = useRMR();
  const { settings: whitelabelSettings } = useWhitelabel();
  const [showPreview, setShowPreview] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [localScript, setLocalScript] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Check if script is valid for current RMR
  const isScriptValid = hasValidScript(rmr.month, rmr.year);
  const hasScript = isScriptValid && (localScript || storedScript);

  const handleGenerateScript = async () => {
    const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
    
    const scriptData = {
      highlight: {
        name: rmr.highlighted_employee_name || "",
        reason: rmr.highlight_reason || ""
      },
      theme: rmr.motivational_theme || "",
      goal: rmr.monthly_goal,
      strategies: rmr.strategies || [],
      video: rmr.selected_video_title ? {
        title: rmr.selected_video_title,
        url: rmr.selected_video_url || ""
      } : undefined,
      previousMonth: {
        revenue: rmr.previous_month_revenue,
        goal: rmr.monthly_goal
      },
      team: activeTeam.map(p => ({
        id: String(p.id),
        name: p.name,
        revenue: p.totalRevenue,
        goal: p.monthlyGoal
      })),
      month: rmr.month,
      year: rmr.year
    };

    setShowProgress(true);
    
    // Safety timeout - close progress after 60 seconds max
    const safetyTimeout = setTimeout(() => {
      console.warn("[RMR] Script generation timed out after 60 seconds");
      setShowProgress(false);
    }, 60000);

    try {
      const result = await generateScript(scriptData);
      clearTimeout(safetyTimeout);
      setShowProgress(false);
      
      if (result) {
        console.log("[RMR] Script generated successfully", {
          scriptLength: result.script_markdown?.length,
          month: rmr.month,
          year: rmr.year
        });
        setLocalScript(result.script_markdown);
        setShowPreview(true);
      }
    } catch (error) {
      clearTimeout(safetyTimeout);
      setShowProgress(false);
      console.error("[RMR] Error generating script:", error);
    }
  };

  const handleDownloadPDF = () => {
    const script = localScript || storedScript;
    if (script) {
      downloadPDF(script, { month: rmr.month, year: rmr.year });
    }
  };

  const displayScript = localScript || (isScriptValid ? storedScript : null);

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  // Format generation date for script
  const getFormattedGenerationDate = () => {
    if (!scriptGeneratedAt || !isScriptValid) return null;
    try {
      const date = new Date(scriptGeneratedAt);
      return format(date, "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return null;
    }
  };

  // Format slides generation date
  const getFormattedSlidesDate = () => {
    if (!rmr.slides_generated_at) return null;
    try {
      const date = new Date(rmr.slides_generated_at);
      return format(date, "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return null;
    }
  };

  // Handle slides generation
  const handleGenerateSlides = async () => {
    const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
    
    const slideData = {
      month: rmr.month,
      year: rmr.year,
      theme: rmr.motivational_theme || "",
      highlight: {
        name: rmr.highlighted_employee_name || "",
        reason: rmr.highlight_reason || ""
      },
      previousMonth: {
        revenue: rmr.previous_month_revenue,
        goal: rmr.monthly_goal
      },
      goal: rmr.monthly_goal,
      strategies: rmr.strategies || [],
      video: rmr.selected_video_url ? {
        title: rmr.selected_video_title || "",
        url: rmr.selected_video_url
      } : undefined,
      team: activeTeam.map(p => ({
        id: String(p.id),
        name: p.name,
        revenue: p.totalRevenue,
        goal: p.monthlyGoal
      })),
      companyName: companyName,
      whitelabel: whitelabelSettings ? {
        systemName: whitelabelSettings.systemName,
        logoUrl: whitelabelSettings.logoUrl,
        primaryColor: whitelabelSettings.primaryColor,
        accentColor: whitelabelSettings.accentColor
      } : undefined,
      rmrId: rmr.id
    };

    const success = await generateSlides(slideData);
    
    // Update RMR only after successful slides generation
    if (success) {
      await updateRMR({
        id: rmr.id,
        slides_generated_at: new Date().toISOString(),
        slides_version: (rmr.slides_version || 0) + 1
      });
    }
  };

  const hasSlides = !!rmr.slides_generated_at;
  const slidesVersion = rmr.slides_version || 0;

  // Gamma slides data
  const hasGammaSlides = !!rmr.gamma_url;
  const gammaUrl = rmr.gamma_url;
  const gammaPptxUrl = rmr.gamma_pptx_url;

  // Format gamma generation date
  const getFormattedGammaDate = () => {
    // We can infer from gamma_url existence, or add a field later
    return null;
  };

  // Handle Gamma slides generation
  const handleGenerateGammaSlides = async () => {
    const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
    
    await generateGammaSlides({
      month: rmr.month,
      year: rmr.year,
      theme: rmr.motivational_theme || "",
      highlight: {
        name: rmr.highlighted_employee_name || "",
        reason: rmr.highlight_reason || ""
      },
      previousMonth: {
        revenue: rmr.previous_month_revenue,
        goal: rmr.monthly_goal
      },
      goal: rmr.monthly_goal,
      strategies: rmr.strategies || [],
      video: rmr.selected_video_url ? {
        title: rmr.selected_video_title || "",
        url: rmr.selected_video_url
      } : undefined,
      team: activeTeam.map(p => ({
        id: String(p.id),
        name: p.name,
        revenue: p.totalRevenue,
        goal: p.monthlyGoal
      })),
      companyName: companyName,
      rmrId: rmr.id
    });
  };

  // NotebookLM artifacts
  const hasNotebookLMArtifacts = !!(rmr as any).notebooklm_generated_at;
  const notebookLMAudioUrl = (rmr as any).notebooklm_audio_url;
  const notebookLMFaq = (rmr as any).notebooklm_faq_json;

  const handleGenerateNotebookLMKit = async () => {
    const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
    
    await generatePremiumKit({
      rmrId: rmr.id,
      month: rmr.month,
      year: rmr.year,
      theme: rmr.motivational_theme || "",
      highlight: {
        name: rmr.highlighted_employee_name || "",
        reason: rmr.highlight_reason || ""
      },
      previousMonth: {
        revenue: rmr.previous_month_revenue,
        goal: rmr.monthly_goal
      },
      goal: rmr.monthly_goal,
      strategies: rmr.strategies || [],
      team: activeTeam.map(p => ({
        id: String(p.id),
        name: p.name,
        revenue: p.totalRevenue,
        goal: p.monthlyGoal
      })),
      companyName: companyName,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Materiais da RMR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Section */}
            {rmr.selected_video_title && (
              <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-start gap-4">
                  {rmr.selected_video_url && getYouTubeThumbnail(rmr.selected_video_url) && (
                    <a 
                      href={rmr.selected_video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative group flex-shrink-0"
                    >
                      <img 
                        src={getYouTubeThumbnail(rmr.selected_video_url)!}
                        alt={rmr.selected_video_title}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-medium text-muted-foreground">Vídeo Motivacional</span>
                    </div>
                    <p className="font-medium text-foreground truncate">{rmr.selected_video_title}</p>
                    {rmr.selected_video_url && (
                      <a 
                        href={rmr.selected_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-500 hover:underline flex items-center gap-1 mt-1"
                      >
                        Assistir no YouTube
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Script Section */}
            <PhaseGatedFeature
              feature="rmr_script_generation"
              overlayMessage="Gere roteiros personalizados com IA na Fase 2"
              forceUnlocked={isPhase2}
            >
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Roteiro da Reunião</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasScript ? (
                      <>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Gerado
                        </Badge>
                        {getFormattedGenerationDate() && (
                          <span className="text-xs text-muted-foreground">
                            Gerado em {getFormattedGenerationDate()}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {hasScript 
                    ? "Roteiro de 45 minutos com falas sugeridas para cada seção da reunião."
                    : "Gere um roteiro estruturado com IA baseado nos dados da RMR."
                  }
                </p>

                <div className="flex gap-2 flex-wrap">
                  {!hasScript ? (
                    <Button
                      onClick={handleGenerateScript}
                      disabled={isGenerating}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar Roteiro com IRIS
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Baixar PDF
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGenerateScript}
                              disabled={isGenerating}
                              className="gap-2"
                            >
                              {isGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              Regenerar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gerar novo roteiro com IRIS</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            </PhaseGatedFeature>

            {/* Slides Section */}
            <PhaseGatedFeature
              feature="rmr_slides_generation"
              overlayMessage="Gere apresentações PPTX premium na Fase 2"
              forceUnlocked={isPhase2}
            >
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Apresentação PPTX</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasSlides ? (
                      <>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Gerado v{slidesVersion}
                        </Badge>
                        {getFormattedSlidesDate() && (
                          <span className="text-xs text-muted-foreground">
                            Gerado em {getFormattedSlidesDate()}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {hasSlides 
                    ? "Apresentação cinematográfica de 6 slides com Smart Notes para o apresentador."
                    : "Gere uma apresentação profissional com base nos dados da RMR."
                  }
                </p>

                <div className="flex gap-2 flex-wrap">
                  {!hasSlides ? (
                    <Button
                      onClick={handleGenerateSlides}
                      disabled={isGeneratingSlides}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isGeneratingSlides ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Presentation className="h-4 w-4 mr-2" />
                          Gerar Apresentação
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleGenerateSlides}
                        disabled={isGeneratingSlides}
                      >
                        {isGeneratingSlides ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Baixar PPTX
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGenerateSlides}
                              disabled={isGeneratingSlides}
                              className="gap-2"
                            >
                              {isGeneratingSlides ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              Regenerar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gerar nova versão da apresentação</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            </PhaseGatedFeature>

            {/* Gamma AI Slides Section */}
            <PhaseGatedFeature
              feature="rmr_gamma_slides"
              overlayMessage="Gere apresentações com IA do Gamma na Fase 2"
              forceUnlocked={isPhase2}
            >
              <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">γ</span>
                    </div>
                    <span className="font-medium">Apresentação (Gamma AI)</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasGammaConfigured ? (
                      hasGammaSlides ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Gerado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/30">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Disponível
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Não configurado
                      </Badge>
                    )}
                  </div>
                </div>

                {hasGammaConfigured ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {hasGammaSlides 
                        ? "Apresentação gerada com IA do Gamma. Design profissional com imagens e vídeos integrados."
                        : "Crie apresentações profissionais com design automático usando IA do Gamma."
                      }
                    </p>

                    {isGeneratingGamma && gammaProgress && (
                      <div className="flex items-center gap-2 mb-3 text-sm text-violet-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{gammaProgress}</span>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {!hasGammaSlides ? (
                        <Button
                          onClick={handleGenerateGammaSlides}
                          disabled={isGeneratingGamma}
                          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                          {isGeneratingGamma ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Gerando com IA...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Gerar com Gamma AI
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          {gammaUrl && (
                            <Button
                              onClick={() => window.open(gammaUrl, "_blank")}
                              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir no Gamma
                            </Button>
                          )}
                          {gammaPptxUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(gammaPptxUrl, "_blank")}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar PPTX
                            </Button>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGenerateGammaSlides}
                                  disabled={isGeneratingGamma}
                                  className="gap-2"
                                >
                                  {isGeneratingGamma ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                  Regenerar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Gerar nova versão com Gamma AI</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crie apresentações profissionais com design automático usando IA do Gamma. 
                      Configure sua API Key nas Configurações para começar.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate?.("settings", { section: "gamma" })}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Ir para Configurações
                    </Button>
                  </>
                )}
              </div>
            </PhaseGatedFeature>

            {/* NotebookLM Premium Kit Section */}
            <PhaseGatedFeature
              feature="rmr_notebooklm_kit"
              overlayMessage="Gere podcasts e briefings com NotebookLM na Fase 2"
              forceUnlocked={isPhase2}
            >
              <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <Headphones className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-medium">Kit Premium (NotebookLM)</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasNotebookLMConfigured ? (
                      hasNotebookLMArtifacts ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Gerado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Disponível
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Não configurado
                      </Badge>
                    )}
                  </div>
                </div>

                {hasNotebookLMConfigured ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {hasNotebookLMArtifacts 
                        ? "Kit Premium com podcast em áudio, briefing executivo e FAQ automático gerados pelo Google NotebookLM."
                        : "Gere um podcast em áudio da reunião, briefing executivo e FAQ com IA do Google NotebookLM."
                      }
                    </p>

                    {isGeneratingNotebookLM && notebookLMProgress && (
                      <div className="flex items-center gap-2 mb-3 text-sm text-orange-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{notebookLMProgress}</span>
                      </div>
                    )}

                    {hasNotebookLMArtifacts ? (
                      <div className="space-y-3">
                        {/* Audio Player */}
                        {notebookLMAudioUrl && (
                          <div className="bg-background/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Headphones className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium">Podcast da RMR</span>
                            </div>
                            <audio 
                              controls 
                              className="w-full h-10"
                              src={notebookLMAudioUrl}
                            >
                              Seu navegador não suporta o elemento de áudio.
                            </audio>
                          </div>
                        )}

                        {/* FAQ Section */}
                        {notebookLMFaq && Array.isArray(notebookLMFaq) && notebookLMFaq.length > 0 && (
                          <div className="bg-background/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium">FAQ da Reunião</span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {notebookLMFaq.slice(0, 5).map((item: { question: string; answer: string }, index: number) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium text-foreground">{item.question}</p>
                                  <p className="text-muted-foreground">{item.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGenerateNotebookLMKit}
                                  disabled={isGeneratingNotebookLM}
                                  className="gap-2"
                                >
                                  {isGeneratingNotebookLM ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                  Regenerar Kit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Gerar novo kit com NotebookLM</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleGenerateNotebookLMKit}
                        disabled={isGeneratingNotebookLM}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      >
                        {isGeneratingNotebookLM ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando Kit...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Kit Premium
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gere podcasts em áudio, briefings executivos e FAQs com o Google NotebookLM Enterprise. 
                      Configure suas credenciais do Google Cloud nas Configurações.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate?.("settings", { section: "notebooklm" })}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Ir para Configurações
                    </Button>
                  </>
                )}
              </div>
            </PhaseGatedFeature>
          </CardContent>
        </Card>
      </motion.div>

      {/* Script Preview Modal */}
      {showPreview && displayScript && typeof displayScript === 'string' && displayScript.length > 0 && (
        <RMRScriptPreview
          key={`preview-${rmr.id}-${Date.now()}`}
          scriptMarkdown={displayScript}
          month={rmr.month}
          year={rmr.year}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownloadPDF}
          isDownloading={isDownloading}
        />
      )}

      {/* Generation Progress Modal */}
      <RMRGenerationProgress 
        isOpen={showProgress}
      />
    </>
  );
};

export default RMRMaterialsSection;
