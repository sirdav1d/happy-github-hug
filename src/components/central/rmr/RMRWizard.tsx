import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Target, Star, Sparkles, Calendar, FileText, Clock, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Salesperson } from "@/types";
import { useRMR, CreateRMRInput, RMRMeeting } from "@/hooks/useRMR";
import { useRMRPreparation, RMRInsights } from "@/hooks/useRMRPreparation";
import { useRMRScript } from "@/hooks/useRMRScript";
import RMRInsightsPanel from "./RMRInsightsPanel";
import VideoSuggestionPanel from "./VideoSuggestionPanel";
import PhaseGatedFeature from "./PhaseGatedFeature";
import RMRGenerationProgress from "./RMRGenerationProgress";
import RMRScriptPreview from "./RMRScriptPreview";

interface RMRWizardProps {
  team: Salesperson[];
  previousMonthRevenue: number;
  previousMonthGoal: number;
  lastRMR?: RMRMeeting | null;
  isPhase2: boolean;
  retroactiveMode?: boolean;
  onClose: () => void;
}

interface SelectedVideo {
  youtube_id: string;
  youtube_url: string;
  title: string;
  thumbnail_url: string;
  duration_formatted: string;
  notes?: string;
}

interface WizardData {
  // Step 1 - Results
  previousRevenue: number;
  previousGoal: number;
  // Step 2 - Highlight
  highlightedEmployeeId: string;
  highlightedEmployeeName: string;
  highlightReason: string;
  // Step 3 - Theme
  motivationalTheme: string;
  // Step 3b - Video (new)
  selectedVideo?: SelectedVideo;
  // Step 4 - Goals
  monthlyGoal: number;
  strategies: string[];
  // Step 5 - Notes
  notes: string;
  // AI Insights
  aiInsights?: RMRInsights | null;
}

const STEPS = [
  { id: 1, title: "Resultados do Mês", icon: Target },
  { id: 2, title: "Colaborador Destaque", icon: Star },
  { id: 3, title: "Tema e Vídeo", icon: Sparkles },
  { id: 4, title: "Metas do Próximo Mês", icon: Calendar },
  { id: 5, title: "Revisão Final", icon: FileText },
];

const SUGGESTED_THEMES = [
  "Superar limites: o impossível é apenas questão de tempo",
  "Juntos somos mais fortes: a força do time",
  "Cada venda é uma conquista: celebre cada passo",
  "Foco no cliente: entender para atender",
  "Resiliência: transformar desafios em oportunidades",
];

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const RMRWizard = ({ team, previousMonthRevenue, previousMonthGoal, lastRMR, isPhase2, retroactiveMode = false, onClose }: RMRWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { generateInsights, isGeneratingInsights, preparationStatus } = useRMRPreparation();
  const { generateScript, isGenerating: isGeneratingScript, downloadPDF, isDownloading } = useRMRScript();
  const [localInsights, setLocalInsights] = useState<RMRInsights | null>(null);
  const [showGenerationProgress, setShowGenerationProgress] = useState(false);
  const [generatedScriptMarkdown, setGeneratedScriptMarkdown] = useState<string | null>(null);
  const [showScriptPreview, setShowScriptPreview] = useState(false);
  
  // Retroactive mode state for month/year selection
  const currentDate = new Date();
  const defaultPreviousMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
  const defaultPreviousYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(defaultPreviousMonth);
  const [selectedYear, setSelectedYear] = useState(defaultPreviousYear);
  
  // Year options for retroactive mode
  const yearOptions = [
    currentDate.getFullYear(),
    currentDate.getFullYear() - 1,
    currentDate.getFullYear() - 2,
  ];
  
  // Sugerir crescimento de 10% sobre a última meta como base
  const suggestedGoal = lastRMR?.monthly_goal 
    ? Math.round(lastRMR.monthly_goal * 1.1) 
    : previousMonthGoal;
  
  const [wizardData, setWizardData] = useState<WizardData>({
    previousRevenue: previousMonthRevenue,
    previousGoal: previousMonthGoal,
    highlightedEmployeeId: "",
    highlightedEmployeeName: "",
    highlightReason: "",
    motivationalTheme: lastRMR?.motivational_theme || "",
    selectedVideo: undefined,
    monthlyGoal: suggestedGoal,
    strategies: lastRMR?.strategies || [],
    notes: "",
    aiInsights: null,
  });
  const [newStrategy, setNewStrategy] = useState("");

  // Sincronizar dados quando props mudarem (dados carregados do backend)
  useEffect(() => {
    setWizardData(prev => ({
      ...prev,
      previousRevenue: previousMonthRevenue,
      previousGoal: previousMonthGoal,
      // Só preenche automaticamente se estiver vazio
      motivationalTheme: prev.motivationalTheme || lastRMR?.motivational_theme || "",
      monthlyGoal: prev.monthlyGoal === 0 || prev.monthlyGoal === previousMonthGoal 
        ? (lastRMR?.monthly_goal ? Math.round(lastRMR.monthly_goal * 1.1) : previousMonthGoal)
        : prev.monthlyGoal,
      strategies: prev.strategies.length === 0 && lastRMR?.strategies 
        ? lastRMR.strategies 
        : prev.strategies,
    }));
  }, [previousMonthRevenue, previousMonthGoal, lastRMR]);

  const { createRMR, isCreating } = useRMR();
  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);

  // Generate insights when entering step 2
  useEffect(() => {
    if (currentStep === 2 && !localInsights && !isGeneratingInsights && activeTeam.length > 0 && isPhase2) {
      generateInsights(
        activeTeam.map(p => ({ id: String(p.id), name: p.name, totalRevenue: p.totalRevenue, monthlyGoal: p.monthlyGoal })),
        previousMonthRevenue,
        previousMonthGoal,
        lastRMR ? { theme: lastRMR.motivational_theme, strategies: lastRMR.strategies, highlightedEmployeeName: lastRMR.highlighted_employee_name } : undefined
      ).then(insights => {
        if (insights) setLocalInsights(insights);
      });
    }
  }, [currentStep, localInsights, isGeneratingInsights, activeTeam, isPhase2, generateInsights, previousMonthRevenue, previousMonthGoal, lastRMR]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddStrategy = () => {
    if (newStrategy.trim()) {
      setWizardData({
        ...wizardData,
        strategies: [...wizardData.strategies, newStrategy.trim()],
      });
      setNewStrategy("");
    }
  };

  const handleRemoveStrategy = (index: number) => {
    setWizardData({
      ...wizardData,
      strategies: wizardData.strategies.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    let rmrMonth: number;
    let rmrYear: number;

    if (retroactiveMode) {
      // Use selected month/year for retroactive
      rmrMonth = selectedMonth;
      rmrYear = selectedYear;
    } else {
      // Use next month for preparation
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      rmrMonth = nextMonth.getMonth() + 1;
      rmrYear = nextMonth.getFullYear();
    }

    const input: CreateRMRInput = {
      date: new Date(rmrYear, rmrMonth - 1, 1).toISOString().split('T')[0],
      month: rmrMonth,
      year: rmrYear,
      monthly_goal: wizardData.monthlyGoal,
      previous_month_revenue: wizardData.previousRevenue,
      motivational_theme: wizardData.motivationalTheme,
      strategies: wizardData.strategies,
      notes: wizardData.notes,
      highlighted_employee_id: wizardData.highlightedEmployeeId,
      highlighted_employee_name: wizardData.highlightedEmployeeName,
      highlight_reason: wizardData.highlightReason,
      status: 'completed',
      // Video fields
      selected_video_id: wizardData.selectedVideo?.youtube_id,
      selected_video_url: wizardData.selectedVideo?.youtube_url,
      selected_video_title: wizardData.selectedVideo?.title,
    };

    createRMR(input, {
      onSuccess: async () => {
        // Auto-generate script after saving RMR (Phase 2 only, not for retroactive)
        if (isPhase2 && !retroactiveMode) {
          setShowGenerationProgress(true);
          
          const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
          const scriptData = {
            highlight: {
              name: wizardData.highlightedEmployeeName,
              reason: wizardData.highlightReason
            },
            theme: wizardData.motivationalTheme,
            goal: wizardData.monthlyGoal,
            strategies: wizardData.strategies,
            video: wizardData.selectedVideo ? {
              title: wizardData.selectedVideo.title,
              url: wizardData.selectedVideo.youtube_url
            } : undefined,
            previousMonth: {
              revenue: wizardData.previousRevenue,
              goal: wizardData.previousGoal
            },
            team: activeTeam.map(p => ({
              id: String(p.id),
              name: p.name,
              revenue: p.totalRevenue,
              goal: p.monthlyGoal
            })),
            month: rmrMonth,
            year: rmrYear
          };

          const result = await generateScript(scriptData);
          setShowGenerationProgress(false);
          
          if (result) {
            setGeneratedScriptMarkdown(result.script_markdown);
            setShowScriptPreview(true);
          } else {
            onClose();
          }
        } else {
          onClose();
        }
      },
    });
  };

  const handleCloseWithPreview = () => {
    setShowScriptPreview(false);
    onClose();
  };

  const percentAchieved = wizardData.previousGoal > 0 
    ? (wizardData.previousRevenue / wizardData.previousGoal) * 100 
    : 0;

  // Top performers from team
  const topPerformers = [...activeTeam]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Progress */}
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl">
              {retroactiveMode ? "Registrar RMR Passada" : "Preparar RMR"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    currentStep === step.id
                      ? "bg-amber-500 border-amber-500 text-white"
                      : currentStep > step.id
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-1",
                      currentStep > step.id ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {STEPS[currentStep - 1].title}
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1 - Previous Month Results */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">
                    {retroactiveMode ? "Dados da RMR Passada" : "Resultados do Mês Anterior"}
                  </h3>
                  <p className="text-muted-foreground">
                    {retroactiveMode 
                      ? "Selecione o mês e preencha os dados da reunião" 
                      : "Revise o desempenho da equipe no mês que passou"}
                  </p>
                </div>

                {/* Month/Year Selection for Retroactive Mode */}
                {retroactiveMode && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="space-y-2">
                      <Label>Mês da RMR</Label>
                      <Select
                        value={String(selectedMonth)}
                        onValueChange={(value) => setSelectedMonth(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m.value} value={String(m.value)}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Select
                        value={String(selectedYear)}
                        onValueChange={(value) => setSelectedYear(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Editable fields for retroactive mode */}
                {retroactiveMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Faturamento Realizado</Label>
                      <Input
                        type="number"
                        value={wizardData.previousRevenue}
                        onChange={(e) => setWizardData({ ...wizardData, previousRevenue: Number(e.target.value) })}
                        placeholder="Ex: 150000"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(wizardData.previousRevenue)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Meta do Mês</Label>
                      <Input
                        type="number"
                        value={wizardData.previousGoal}
                        onChange={(e) => setWizardData({ ...wizardData, previousGoal: Number(e.target.value) })}
                        placeholder="Ex: 200000"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(wizardData.previousGoal)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <p className="text-sm text-muted-foreground">Meta do Mês</p>
                      <p className="text-2xl font-bold">{formatCurrency(wizardData.previousGoal)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <p className="text-sm text-muted-foreground">Faturamento Realizado</p>
                      <p className={cn(
                        "text-2xl font-bold",
                        percentAchieved >= 100 ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {formatCurrency(wizardData.previousRevenue)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Atingimento</span>
                    <span className={cn(
                      "font-bold text-lg",
                      percentAchieved >= 100 ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {percentAchieved.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(percentAchieved, 100)} className="h-3" />
                </div>

                {/* Contexto da última RMR - hide in retroactive mode */}
                {lastRMR && !retroactiveMode && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Contexto da Última RMR
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Destaque</p>
                        <p className="font-medium">{lastRMR.highlighted_employee_name || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Meta</p>
                        <p className="font-medium">{formatCurrency(lastRMR.monthly_goal)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tema</p>
                        <p className="font-medium">{lastRMR.motivational_theme || "Não definido"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top performers summary */}
                <div>
                  <h4 className="font-medium mb-3">Top Performers</h4>
                  <div className="space-y-2">
                    {topPerformers.slice(0, 3).map((person, idx) => (
                      <div key={person.id} className="flex items-center justify-between p-2 rounded bg-secondary/20">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            idx === 0 ? "bg-amber-500 text-white" : "bg-secondary text-foreground"
                          )}>
                            {idx + 1}
                          </span>
                          <span>{person.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(person.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 - Highlight Employee with AI Insights */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Colaborador Destaque</h3>
                  <p className="text-muted-foreground">Reconheça quem se destacou este mês</p>
                </div>

                {/* AI Insights Panel - Visible for all, interactive for Phase 2 */}
                <RMRInsightsPanel
                  highlightCandidates={localInsights?.highlight_candidates || preparationStatus?.ai_generated_highlights || []}
                  suggestedTheme={localInsights?.suggested_theme || preparationStatus?.ai_suggested_theme || undefined}
                  themeContext={localInsights?.theme_context}
                  suggestedStrategies={localInsights?.suggested_strategies || preparationStatus?.ai_suggested_strategies || undefined}
                  suggestedGoal={localInsights?.suggested_goal}
                  goalReasoning={localInsights?.goal_reasoning}
                  isPhase2={isPhase2}
                  selectedHighlightId={wizardData.highlightedEmployeeId}
                  isLoading={isGeneratingInsights}
                  onSelectHighlight={(candidate) => {
                    setWizardData({
                      ...wizardData,
                      highlightedEmployeeId: candidate.employee_id || "",
                      highlightedEmployeeName: candidate.employee_name,
                      highlightReason: candidate.reason,
                    });
                  }}
                  onSelectTheme={(theme) => {
                    setWizardData({
                      ...wizardData,
                      motivationalTheme: theme,
                    });
                  }}
                  onSelectStrategies={(strategies) => {
                    setWizardData({
                      ...wizardData,
                      strategies: [...new Set([...wizardData.strategies, ...strategies])],
                    });
                  }}
                />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selecione o Destaque</Label>
                    <Select
                      value={wizardData.highlightedEmployeeId}
                      onValueChange={(value) => {
                        const person = activeTeam.find(p => String(p.id) === value);
                        setWizardData({
                          ...wizardData,
                          highlightedEmployeeId: value,
                          highlightedEmployeeName: person?.name || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um colaborador..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTeam.map((person) => (
                          <SelectItem key={String(person.id)} value={String(person.id)}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{person.name}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(person.totalRevenue)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Motivo do Reconhecimento</Label>
                    <Textarea
                      placeholder="Ex: Maior faturamento do mês, melhor conversão, superou a meta individual..."
                      value={wizardData.highlightReason}
                      onChange={(e) => setWizardData({ ...wizardData, highlightReason: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {wizardData.highlightedEmployeeId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-500/20">
                        <Star className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{wizardData.highlightedEmployeeName}</p>
                        <p className="text-sm text-muted-foreground">Destaque do Mês</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3 - Motivational Theme + Video */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Tema e Vídeo Motivacional</h3>
                  <p className="text-muted-foreground">Escolha uma mensagem inspiradora e um vídeo para o mês</p>
                </div>

                <div className="space-y-2">
                  <Label>Sugestões de Temas</Label>
                  <div className="grid gap-2">
                    {SUGGESTED_THEMES.map((theme, idx) => (
                      <Button
                        key={idx}
                        variant={wizardData.motivationalTheme === theme ? "default" : "outline"}
                        className={cn(
                          "justify-start h-auto py-3 text-left",
                          wizardData.motivationalTheme === theme && "bg-amber-500 hover:bg-amber-600"
                        )}
                        onClick={() => setWizardData({ ...wizardData, motivationalTheme: theme })}
                      >
                        <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{theme}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ou escreva seu próprio tema</Label>
                  <Textarea
                    placeholder="Digite uma mensagem motivacional personalizada..."
                    value={wizardData.motivationalTheme}
                    onChange={(e) => setWizardData({ ...wizardData, motivationalTheme: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Video Suggestion Panel */}
                {wizardData.motivationalTheme && (
                  <VideoSuggestionPanel
                    theme={wizardData.motivationalTheme}
                    isPhase2={isPhase2}
                    selectedVideoId={wizardData.selectedVideo?.youtube_id}
                    onSelectVideo={(video, notes) => {
                      setWizardData({
                        ...wizardData,
                        selectedVideo: {
                          youtube_id: video.youtube_id,
                          youtube_url: video.youtube_url,
                          title: video.title,
                          thumbnail_url: video.thumbnail_url || "",
                          duration_formatted: video.duration_formatted || "",
                          notes,
                        },
                      });
                    }}
                  />
                )}

                {/* Selected video preview */}
                {wizardData.selectedVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent border border-violet-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <Play className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{wizardData.selectedVideo.title}</p>
                        <p className="text-sm text-muted-foreground">Vídeo selecionado para a RMR</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWizardData({ ...wizardData, selectedVideo: undefined })}
                      >
                        Remover
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 4 - Goals */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Metas do Próximo Mês</h3>
                  <p className="text-muted-foreground">Defina a meta e as estratégias para o próximo período</p>
                </div>

                <div className="space-y-2">
                  <Label>Meta de Faturamento</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={wizardData.monthlyGoal}
                      onChange={(e) => setWizardData({ ...wizardData, monthlyGoal: parseFloat(e.target.value) || 0 })}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mês anterior: {formatCurrency(wizardData.previousGoal)} → 
                    Variação: {((wizardData.monthlyGoal / wizardData.previousGoal - 1) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Estratégias do Mês</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar estratégia..."
                      value={newStrategy}
                      onChange={(e) => setNewStrategy(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStrategy()}
                    />
                    <Button onClick={handleAddStrategy} variant="outline">
                      Adicionar
                    </Button>
                  </div>
                  
                  {wizardData.strategies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {wizardData.strategies.map((strategy, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveStrategy(idx)}
                        >
                          {strategy} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5 - Review */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Revisão Final</h3>
                  <p className="text-muted-foreground">Confirme as informações antes de salvar</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-500" />
                      Resultados do Mês Anterior
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Faturamento: {formatCurrency(wizardData.previousRevenue)} ({percentAchieved.toFixed(0)}% da meta)
                    </p>
                  </div>

                  {wizardData.highlightedEmployeeName && (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Destaque do Mês
                      </h4>
                      <p className="font-semibold">{wizardData.highlightedEmployeeName}</p>
                      <p className="text-sm text-muted-foreground">{wizardData.highlightReason}</p>
                    </div>
                  )}

                  {wizardData.motivationalTheme && (
                    <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        Tema Motivacional
                      </h4>
                      <p className="italic">"{wizardData.motivationalTheme}"</p>
                    </div>
                  )}

                  {/* Selected Video Display */}
                  {wizardData.selectedVideo && (
                    <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Play className="h-4 w-4 text-violet-500" />
                        Vídeo Motivacional
                      </h4>
                      <div className="flex items-start gap-4">
                        {wizardData.selectedVideo.thumbnail_url && (
                          <div className="relative flex-shrink-0">
                            <img 
                              src={wizardData.selectedVideo.thumbnail_url}
                              alt={wizardData.selectedVideo.title}
                              className="w-28 h-16 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="p-1.5 rounded-full bg-black/60">
                                <Play className="h-4 w-4 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-2">
                            {wizardData.selectedVideo.title}
                          </p>
                          {wizardData.selectedVideo.duration_formatted && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {wizardData.selectedVideo.duration_formatted}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      Meta do Próximo Mês
                    </h4>
                    <p className="text-2xl font-bold text-emerald-500">{formatCurrency(wizardData.monthlyGoal)}</p>
                    {wizardData.strategies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {wizardData.strategies.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas Adicionais (opcional)</Label>
                  <Textarea
                    placeholder="Adicione observações ou lembretes para a RMR..."
                    value={wizardData.notes}
                    onChange={(e) => setWizardData({ ...wizardData, notes: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Footer with Navigation */}
        <div className="border-t border-border p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600">
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={isCreating || isGeneratingScript}
            >
              {isCreating || isGeneratingScript 
                ? "Salvando..." 
                : retroactiveMode 
                  ? "Registrar RMR" 
                  : "Salvar RMR"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* Generation Progress Modal */}
      <RMRGenerationProgress isOpen={showGenerationProgress} />

      {/* Script Preview Modal */}
      {showScriptPreview && generatedScriptMarkdown && (() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const rmrMonth = nextMonth.getMonth() + 1;
        const rmrYear = nextMonth.getFullYear();
        
        // Prepare slide data for PowerPoint generation
        const slideData = {
          theme: wizardData.motivationalTheme,
          highlight: {
            name: wizardData.highlightedEmployeeName,
            reason: wizardData.highlightReason,
          },
          previousMonth: {
            revenue: wizardData.previousRevenue,
            goal: wizardData.previousGoal,
          },
          goal: wizardData.monthlyGoal,
          strategies: wizardData.strategies,
          video: wizardData.selectedVideo ? {
            title: wizardData.selectedVideo.title,
            url: wizardData.selectedVideo.youtube_url,
            youtubeId: wizardData.selectedVideo.youtube_id,
          } : undefined,
          team: activeTeam.map(p => ({
            id: String(p.id),
            name: p.name,
            revenue: p.totalRevenue,
            goal: p.monthlyGoal,
          })),
        };
        
        return (
          <RMRScriptPreview
            scriptMarkdown={generatedScriptMarkdown}
            month={rmrMonth}
            year={rmrYear}
            onClose={handleCloseWithPreview}
            onDownload={() => downloadPDF(generatedScriptMarkdown, { month: rmrMonth, year: rmrYear })}
            isDownloading={isDownloading}
            slideData={slideData}
          />
        );
      })()}
    </motion.div>
  );
};

export default RMRWizard;
