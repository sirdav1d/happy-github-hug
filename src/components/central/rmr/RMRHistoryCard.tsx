import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Target, 
  Play, 
  FileText, 
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  Download,
  Eye,
  Copy,
  Trash2,
  Presentation,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RMRMeeting, useRMR } from "@/hooks/useRMR";
import { useRMRScript } from "@/hooks/useRMRScript";
import { useRMRSlides } from "@/hooks/useRMRSlides";
import { Salesperson } from "@/types";
import { toast } from "sonner";

interface RMRHistoryCardProps {
  meetings: RMRMeeting[];
  isLoading: boolean;
  onViewDetails?: (rmr: RMRMeeting) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  team?: Salesperson[];
  companyName?: string;
}

const RMRHistoryCard = ({ meetings, isLoading, onViewDetails, onDelete, isDeleting, team = [], companyName }: RMRHistoryCardProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);
  const { downloadPDF } = useRMRScript();
  const { generateSlides, isGenerating: isGeneratingSlides } = useRMRSlides();
  const { updateRMR } = useRMR();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return monthNames[month - 1] || "Mes";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Realizada
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Calendar className="h-3 w-3 mr-1" />
            Agendada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Em Preparacao
          </Badge>
        );
    }
  };

  const getYouTubeThumbnail = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDuplicate = (rmr: RMRMeeting) => {
    toast.info("Funcionalidade em desenvolvimento: Duplicar RMR");
  };

  const handleGenerateSlides = async (rmr: RMRMeeting) => {
    setGeneratingSlideId(rmr.id);
    
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
      rmrId: rmr.id,
      onSlidesGenerated: (rmrId: string) => {
        updateRMR({
          id: rmrId,
          slides_generated_at: new Date().toISOString(),
          slides_version: (rmr.slides_version || 0) + 1
        });
      }
    };

    try {
      await generateSlides(slideData);
    } finally {
      setGeneratingSlideId(null);
    }
  };

  // Get completed meetings sorted by date
  const completedMeetings = meetings
    .filter(m => m.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historico de Reunioes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Carregando historico...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completedMeetings.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historico de Reunioes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma RMR registrada ainda</p>
            <p className="text-sm">Clique em "Preparar RMR" para criar a primeira</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historico de Reunioes
          </CardTitle>
          <Badge variant="secondary">
            {completedMeetings.length} RMR{completedMeetings.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {completedMeetings.map((rmr, idx) => {
          const isExpanded = expandedId === rmr.id;
          const percent = rmr.monthly_goal > 0 
            ? (rmr.previous_month_revenue / rmr.monthly_goal) * 100 
            : 0;
          const hasVideo = !!rmr.selected_video_title;
          const hasStrategies = rmr.strategies && rmr.strategies.length > 0;

          return (
            <motion.div
              key={rmr.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Header - Always visible */}
              <div 
                className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(rmr.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {getMonthName(rmr.month)} {rmr.year}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(rmr.date)}</span>
                      {rmr.highlighted_employee_name && (
                        <>
                          <span>-</span>
                          <Trophy className="h-3 w-3 text-amber-500" />
                          <span>{rmr.highlighted_employee_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="font-medium text-foreground">
                      {formatCurrency(rmr.previous_month_revenue)}
                    </p>
                    <p className={`text-sm ${percent >= 100 ? 'text-emerald-500' : percent >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {percent.toFixed(0)}% da meta
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status indicators */}
                    <div className="hidden md:flex items-center gap-1">
                      {hasVideo && (
                        <div className="p-1 rounded bg-violet-500/10" title="Video selecionado">
                          <Play className="h-3 w-3 text-violet-500" />
                        </div>
                      )}
                      {hasStrategies && (
                        <div className="p-1 rounded bg-blue-500/10" title="Estrategias definidas">
                          <Target className="h-3 w-3 text-blue-500" />
                        </div>
                      )}
                      {rmr.slides_generated_at && (
                        <div className="p-1 rounded bg-cyan-500/10" title={`Slides gerados (v${rmr.slides_version || 1})`}>
                          <Presentation className="h-3 w-3 text-cyan-500" />
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-card border-t border-border space-y-4">
                      {/* Timeline */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">Preparada:</span>
                          <span className="font-medium">{formatDate(rmr.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground">Realizada:</span>
                          <span className="font-medium">{formatDate(rmr.date)}</span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Highlight */}
                        {rmr.highlighted_employee_name && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span className="font-medium text-sm">Destaque do Mes</span>
                            </div>
                            <p className="font-semibold text-foreground">{rmr.highlighted_employee_name}</p>
                            {rmr.highlight_reason && (
                              <p className="text-sm text-muted-foreground mt-1">{rmr.highlight_reason}</p>
                            )}
                          </div>
                        )}

                        {/* Theme */}
                        {rmr.motivational_theme && (
                          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-violet-500" />
                              <span className="font-medium text-sm">Tema Motivacional</span>
                            </div>
                            <p className="font-semibold text-foreground">{rmr.motivational_theme}</p>
                          </div>
                        )}

                        {/* Goal */}
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">Meta Definida</span>
                          </div>
                          <p className="font-semibold text-foreground">{formatCurrency(rmr.monthly_goal)}</p>
                        </div>
                      </div>

                      {/* Video */}
                      {hasVideo && (
                        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                          <div className="flex items-center gap-4">
                            {rmr.selected_video_url && getYouTubeThumbnail(rmr.selected_video_url) && (
                              <a 
                                href={rmr.selected_video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="relative group flex-shrink-0"
                              >
                                <img 
                                  src={getYouTubeThumbnail(rmr.selected_video_url)!}
                                  alt={rmr.selected_video_title || "Video"}
                                  className="w-24 h-14 object-cover rounded"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </a>
                            )}
                            <div>
                              <p className="text-sm text-muted-foreground">Video Motivacional</p>
                              <p className="font-medium text-foreground">{rmr.selected_video_title}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Strategies */}
                      {hasStrategies && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Estrategias Definidas</p>
                          <div className="flex flex-wrap gap-2">
                            {rmr.strategies?.map((strategy, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {strategy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(rmr)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Usar como Base
                          </Button>
                          {onViewDetails && (
                            <Button variant="ghost" size="sm" onClick={() => onViewDetails(rmr)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          )}
                          
                          {/* Slides Actions - Always Available */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleGenerateSlides(rmr)}
                            disabled={generatingSlideId === rmr.id}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          >
                            {generatingSlideId === rmr.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Presentation className="h-4 w-4 mr-2" />
                            )}
                            {rmr.slides_generated_at ? 'Regenerar PPTX' : 'Gerar PPTX'}
                          </Button>
                        </div>
                        
                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir RMR?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a RMR de {getMonthName(rmr.month)} {rmr.year}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-rose-500 hover:bg-rose-600"
                                onClick={() => onDelete?.(rmr.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RMRHistoryCard;