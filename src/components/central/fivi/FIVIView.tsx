import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, User, Calendar, Target, CheckCircle, Clock, ArrowRight, Sparkles, Trash2, ChevronDown, ChevronUp, Video, FileText, ExternalLink, Upload, Mic, X, Play, Pause, Brain, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import InfoTooltip from "../InfoTooltip";
import { Salesperson } from "@/types";
import { useFIVI, CreateFIVIInput, AIAnalysis } from "@/hooks/useFIVI";
import { toast } from "sonner";
import AudioRecorder from "./AudioRecorder";
import FIVIAIAnalysisPanel from "./FIVIAIAnalysisPanel";
import { useBehavioralProfiles } from "@/hooks/useBehavioralProfiles";

interface FIVIViewProps {
  team: Salesperson[];
}

const FIVIView = ({ team }: FIVIViewProps) => {
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New states for audio recording and AI analysis
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const [formData, setFormData] = useState({
    actionsExecuted: "",
    improvementIdeas: "",
    failedActions: "",
    supportNeeded: "",
    weeklyCommitment: "",
    recordingUrl: "",
    meetingNotes: "",
  });

  const { 
    sessions, 
    isLoading, 
    createFIVI, 
    deleteFIVI,
    removeRecording,
    removeAudioFromSession,
    isCreating,
    isRemovingRecording,
    isRemovingAudio,
    getLatestSession,
    getCommitmentRate,
    getPendingFIVIs,
    uploadAudio,
    getSignedAudioUrl,
    deleteAudioFile,
    analyzeAudio,
  } = useFIVI();

  // Behavioral profiles for FIVI insights
  const { profiles: behavioralProfiles, moduleConfig, isModuleEnabled } = useBehavioralProfiles();
  const showBehavioralTips = isModuleEnabled && moduleConfig?.show_in_fivi;

  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
  const currentWeek = Math.ceil(new Date().getDate() / 7);

  const selectedPerson = activeTeam.find(s => s.id === selectedSalesperson);
  const weekData = selectedPerson?.weeks.find(w => w.week === currentWeek);
  const previousFIVI = selectedPerson ? getLatestSession(selectedPerson.id) : null;

  // Stats
  const pendingCount = getPendingFIVIs(activeTeam.map(t => t.id), currentWeek).length;
  const completedThisMonth = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && 
           sessionDate.getFullYear() === now.getFullYear() &&
           s.status === 'completed';
  }).length;
  const commitmentRate = getCommitmentRate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const questions = [
    {
      id: 'actionsExecuted',
      number: 1,
      question: "Quais ações você executou para alcançar esses resultados?",
      placeholder: "Ex: Fiz 30 ligações, visitei 5 clientes, enviei 20 propostas...",
      tooltip: "Identifique as ações concretas que o vendedor realizou. Isso ajuda a entender o que está funcionando."
    },
    {
      id: 'improvementIdeas',
      number: 2,
      question: "O que você acredita que dá para acrescentar essa semana?",
      placeholder: "Ex: Posso aumentar o número de follow-ups, focar em clientes inativos...",
      tooltip: "Estimule o vendedor a pensar em novas estratégias. O objetivo é evolução contínua."
    },
    {
      id: 'failedActions',
      number: 3,
      question: "Teve alguma ação que não funcionou?",
      placeholder: "Ex: A abordagem por email frio não teve resposta...",
      tooltip: "Identificar o que não funciona é tão importante quanto saber o que funciona. Sem julgamento."
    },
    {
      id: 'supportNeeded',
      number: 4,
      question: "Como posso te ajudar a melhorar seus resultados?",
      placeholder: "Ex: Preciso de treinamento em negociação, mais leads qualificados...",
      tooltip: "Essa pergunta coloca o gestor como facilitador. O vendedor deve se sentir apoiado."
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
      toast.error('Formato inválido. Use MP3, WAV ou M4A.');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 50MB.');
      return;
    }

    setAudioFile(file);
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle recorded audio from AudioRecorder component
  const handleRecordingComplete = (blob: Blob) => {
    setRecordedAudioBlob(blob);
    // Convert blob to file for upload
    const file = new File([blob], `fivi-recording-${Date.now()}.webm`, { type: blob.type });
    setAudioFile(file);
  };

  const handleClearRecording = () => {
    setRecordedAudioBlob(null);
    setAudioFile(null);
    setAiAnalysis(null);
    setShowAIPanel(false);
  };

  // Analyze audio with AI
  const handleAnalyzeWithAI = async () => {
    if (!recordedAudioBlob || !selectedPerson) {
      toast.error('Grave um áudio primeiro');
      return;
    }

    setIsAnalyzing(true);
    try {
      // First upload the audio
      const audioFile = new File([recordedAudioBlob], `fivi-recording-${Date.now()}.webm`, { type: recordedAudioBlob.type });
      const audioPath = await uploadAudio(audioFile);
      
      if (!audioPath) {
        throw new Error('Falha ao fazer upload do áudio');
      }

      // Then analyze with AI
      const analysis = await analyzeAudio(
        audioPath,
        selectedPerson.id,
        {
          salesperson_name: selectedPerson.name,
          weekly_goal: weekData?.goal || 0,
          weekly_realized: weekData?.revenue || 0,
        }
      );

      if (analysis) {
        setAiAnalysis(analysis);
        setShowAIPanel(true);
        toast.success('Análise concluída!');
      } else {
        throw new Error('Análise retornou vazia');
      }
    } catch (error) {
      console.error('Error analyzing audio:', error);
      toast.error('Erro ao analisar áudio. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPerson) return;

    setIsUploading(true);
    let audioPath: string | undefined;

    try {
      // Upload audio if exists
      if (audioFile) {
        const path = await uploadAudio(audioFile);
        if (path) {
          audioPath = path;
        }
      }

      const input: CreateFIVIInput = {
        salesperson_id: selectedPerson.id,
        salesperson_name: selectedPerson.name,
        week_number: currentWeek,
        actions_executed: formData.actionsExecuted,
        improvement_ideas: formData.improvementIdeas,
        failed_actions: formData.failedActions,
        support_needed: formData.supportNeeded,
        weekly_commitment: parseFloat(formData.weeklyCommitment) || 0,
        weekly_goal: weekData?.goal || 0,
        weekly_realized: weekData?.revenue || 0,
        previous_commitment: previousFIVI?.weekly_commitment,
        previous_realized: previousFIVI?.weekly_realized,
        recording_url: formData.recordingUrl || undefined,
        meeting_notes: formData.meetingNotes || undefined,
        audio_file_path: audioPath,
        status: 'completed',
        // Add AI analysis data if available
        ai_transcription: aiAnalysis?.transcription,
        ai_summary: aiAnalysis?.summary,
        ai_sentiment_analysis: aiAnalysis?.sentiment,
        ai_commitments: aiAnalysis?.commitments,
        ai_concerns: aiAnalysis?.concerns,
        ai_confidence_score: aiAnalysis?.confidenceScore,
        ai_key_points: aiAnalysis?.keyPoints,
        ai_processed_at: aiAnalysis ? new Date().toISOString() : undefined,
      };

      createFIVI(input, {
        onSuccess: () => {
          setFormData({
            actionsExecuted: "",
            improvementIdeas: "",
            failedActions: "",
            supportNeeded: "",
            weeklyCommitment: "",
            recordingUrl: "",
            meetingNotes: "",
          });
          setSelectedSalesperson("");
          setAudioFile(null);
          setRecordedAudioBlob(null);
          setAiAnalysis(null);
          setShowAIPanel(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayAudio = async (sessionId: string, filePath: string) => {
    if (playingAudioId === sessionId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    // Get signed URL if not cached
    if (!audioUrls[sessionId]) {
      const url = await getSignedAudioUrl(filePath);
      if (url) {
        setAudioUrls(prev => ({ ...prev, [sessionId]: url }));
      } else {
        toast.error('Erro ao carregar áudio');
        return;
      }
    }

    setPlayingAudioId(sessionId);
  };

  useEffect(() => {
    if (playingAudioId && audioUrls[playingAudioId] && audioRef.current) {
      audioRef.current.src = audioUrls[playingAudioId];
      audioRef.current.play();
    }
  }, [playingAudioId, audioUrls]);

  const handleDeleteSession = async (session: typeof sessions[0]) => {
    // Delete audio file if exists
    if (session.audio_file_path) {
      await deleteAudioFile(session.audio_file_path);
    }
    deleteFIVI(session.id);
    setExpandedSessionId(null);
  };

  // Get recent sessions for history
  const recentSessions = sessions.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <MessageSquare className="h-6 w-6 text-violet-500" />
            </div>
            FIVI - Feedback Individual do Vendedor
          </h1>
          <p className="text-muted-foreground mt-1">
            Ritual semanal de acompanhamento e desenvolvimento individual
          </p>
        </div>
        <InfoTooltip 
          text="A FIVI é o momento de conversar individualmente com cada vendedor sobre resultados, desafios e compromissos. Realize toda segunda-feira para alinhar a semana."
          maxWidth={320}
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                FIVIs Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {isLoading ? '...' : pendingCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                para esta semana
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Realizadas no Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                {isLoading ? '...' : completedThisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {activeTeam.length * 4} previstas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Cumprimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {commitmentRate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                dos compromissos atingidos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Formulário de FIVI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="bg-gradient-to-br from-violet-500/5 via-card to-card border-violet-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Nova FIVI - Semana {currentWeek}
              </CardTitle>
              <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/30">
                Gravação + Análise IA
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Vendedor */}
            <div className="space-y-2">
              <Label>Selecione o Vendedor</Label>
              <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="Escolha um vendedor..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTeam.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {person.name.charAt(0)}
                        </div>
                        {person.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dados do PGV e FIVI anterior */}
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                {/* Dados atuais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Meta da Semana</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(weekData?.goal || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Realizado</p>
                    <p className={cn(
                      "text-lg font-bold",
                      (weekData?.revenue || 0) >= (weekData?.goal || 0) ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {formatCurrency(weekData?.revenue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% Atingido</p>
                    <p className={cn(
                      "text-lg font-bold",
                      ((weekData?.revenue || 0) / (weekData?.goal || 1)) * 100 >= 100 ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {(((weekData?.revenue || 0) / (weekData?.goal || 1)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* FIVI anterior */}
                {previousFIVI && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium text-amber-500 mb-2">
                      FIVI Anterior (Semana {previousFIVI.week_number})
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Compromisso</p>
                        <p className="font-medium">{formatCurrency(previousFIVI.weekly_commitment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entregue</p>
                        <p className={cn(
                          "font-medium",
                          previousFIVI.weekly_realized >= previousFIVI.weekly_commitment 
                            ? "text-emerald-500" 
                            : "text-destructive"
                        )}>
                          {formatCurrency(previousFIVI.weekly_realized)}
                          {previousFIVI.weekly_realized >= previousFIVI.weekly_commitment ? (
                            <CheckCircle className="inline h-4 w-4 ml-1" />
                          ) : (
                            <Target className="inline h-4 w-4 ml-1" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guia das 5 Perguntas */}
                <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
                  <p className="text-sm font-medium text-violet-500 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Guia: As 5 Perguntas Estratégicas
                  </p>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">1.</span>
                      Quais ações você executou para alcançar esses resultados?
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">2.</span>
                      O que você acredita que dá para acrescentar essa semana?
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">3.</span>
                      Teve alguma ação que não funcionou?
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-500 font-bold">4.</span>
                      Como posso te ajudar a melhorar seus resultados?
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-500 font-bold">5.</span>
                      Quanto você se compromete a entregar esta semana?
                    </li>
                  </ol>
                </div>
              </motion.div>
            )}

            {/* Gravação de Áudio */}
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-violet-500" />
                    Gravação da Conversa
                    <InfoTooltip text="Grave a conversa com o vendedor. A IA irá transcrever e analisar automaticamente." />
                  </Label>
                  
                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    onClear={handleClearRecording}
                    disabled={!selectedPerson}
                  />
                </div>

                {/* Botão Analisar com IA */}
                {recordedAudioBlob && !aiAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    <Button
                      onClick={handleAnalyzeWithAI}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white gap-2 px-6"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analisando com IA...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Analisar com IA
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Painel de Análise IA */}
                {showAIPanel && aiAnalysis && (
                  <FIVIAIAnalysisPanel
                    analysis={aiAnalysis}
                    onReprocess={handleAnalyzeWithAI}
                    isReprocessing={isAnalyzing}
                    salespersonName={selectedPerson?.name}
                    behavioralProfile={behavioralProfiles.find(p => p.salespersonId === selectedPerson?.id)}
                    showBehavioralTips={showBehavioralTips}
                  />
                )}
              </motion.div>
            )}

            {/* Pergunta 5 - Compromisso (sempre visível quando vendedor selecionado) */}
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2 pt-4 border-t border-border"
              >
                <Label className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-sm font-bold">
                    5
                  </span>
                  Quanto você se compromete a entregar esta semana?
                  <InfoTooltip text="O compromisso deve ser um valor específico. Isso cria responsabilidade e será cobrado na próxima FIVI." />
                </Label>
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.weeklyCommitment}
                    onChange={(e) => setFormData({ ...formData, weeklyCommitment: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </motion.div>
            )}

            {/* Campos opcionais de gravação e notas */}
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="pt-4 border-t border-border space-y-4"
              >
                <p className="text-sm font-medium text-muted-foreground">Campos Opcionais</p>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Link da Gravação Externa
                    <InfoTooltip text="Cole aqui o link da gravação da reunião (Google Meet, Zoom, etc)." />
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.recordingUrl}
                    onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                  />
                </div>

                {/* Upload de Áudio (alternativa à gravação) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Upload de Áudio (alternativa)
                    <InfoTooltip text="Se preferir, faça upload de um arquivo de áudio (MP3, WAV, M4A - máx 50MB)." />
                  </Label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {audioFile && !recordedAudioBlob ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <div className="p-2 rounded-lg bg-violet-500/20">
                        <Mic className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAudio}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : !recordedAudioBlob ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full justify-start gap-2 text-muted-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar arquivo de áudio...
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notas da Reunião
                    <InfoTooltip text="Anote observações adicionais sobre a conversa." />
                  </Label>
                  <Textarea
                    placeholder="Observações, decisões tomadas, próximos passos..."
                    value={formData.meetingNotes}
                    onChange={(e) => setFormData({ ...formData, meetingNotes: e.target.value })}
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Botão de submit */}
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <Button 
                  className="bg-violet-500 hover:bg-violet-600 text-white gap-2"
                  onClick={handleSubmit}
                  disabled={!selectedPerson || isCreating || isUploading || !formData.weeklyCommitment}
                >
                  {isCreating || isUploading ? 'Salvando...' : 'Registrar FIVI'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {!formData.weeklyCommitment && (
                  <p className="text-xs text-muted-foreground mt-2">
                    * Informe o compromisso semanal para salvar
                  </p>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Histórico de Feedbacks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Histórico de FIVIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Carregando histórico...
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma FIVI registrada ainda</p>
                <p className="text-sm">Selecione um vendedor acima para registrar a primeira</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session, idx) => {
                  const isExpanded = expandedSessionId === session.id;
                  const hasAIAnalysis = !!session.ai_processed_at;
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + idx * 0.05 }}
                      className="rounded-lg bg-secondary/30 overflow-hidden"
                    >
                      {/* Header do card - clicável */}
                      <div
                        className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-violet-500/10">
                            <User className="h-5 w-5 text-violet-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {session.salesperson_name}
                              </p>
                              {session.recording_url && (
                                <Video className="h-4 w-4 text-violet-500" />
                              )}
                              {session.audio_file_path && (
                                <Mic className="h-4 w-4 text-emerald-500" />
                              )}
                              {hasAIAnalysis && (
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs">
                                  <Brain className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Semana {session.week_number} • {new Date(session.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Compromisso:</span>
                              <span className="font-medium text-foreground">{formatCurrency(session.weekly_commitment)}</span>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm text-muted-foreground">Entregou:</span>
                              <span className={cn(
                                "font-medium",
                                session.weekly_realized >= session.weekly_commitment ? "text-emerald-500" : "text-amber-500"
                              )}>
                                {formatCurrency(session.weekly_realized)}
                              </span>
                              {session.weekly_realized >= session.weekly_commitment ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Target className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Conteúdo expandido */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border"
                          >
                            <div className="p-4 space-y-4">
                              {/* AI Analysis Panel (if available) */}
                              {hasAIAnalysis && session.ai_summary && (
                                <FIVIAIAnalysisPanel
                                  analysis={{
                                    transcription: session.ai_transcription || '',
                                    summary: session.ai_summary || '',
                                    sentiment: session.ai_sentiment_analysis as AIAnalysis['sentiment'] || {
                                      overall: 'neutro' as const,
                                      score: 50,
                                      indicators: [],
                                    },
                                    commitments: session.ai_commitments || [],
                                    concerns: session.ai_concerns || [],
                                    confidenceScore: session.ai_confidence_score || 50,
                                    keyPoints: session.ai_key_points as AIAnalysis['keyPoints'] || {
                                      conquistas: [],
                                      desafios: [],
                                      oportunidades: [],
                                      acoes_sugeridas: [],
                                    },
                                  }}
                                  isHistoryView
                                  salespersonName={session.salesperson_name}
                                  behavioralProfile={behavioralProfiles.find(p => p.salespersonId === session.salesperson_id)}
                                  showBehavioralTips={showBehavioralTips}
                                />
                              )}

                              {/* Respostas das perguntas (se preenchidas manualmente) */}
                              {(session.actions_executed || session.improvement_ideas || session.failed_actions || session.support_needed) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {session.actions_executed && (
                                    <div className="p-3 rounded-lg bg-background/50">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">1. Ações Executadas</p>
                                      <p className="text-sm text-foreground">{session.actions_executed}</p>
                                    </div>
                                  )}
                                  {session.improvement_ideas && (
                                    <div className="p-3 rounded-lg bg-background/50">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">2. Ideias de Melhoria</p>
                                      <p className="text-sm text-foreground">{session.improvement_ideas}</p>
                                    </div>
                                  )}
                                  {session.failed_actions && (
                                    <div className="p-3 rounded-lg bg-background/50">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">3. Ações que não Funcionaram</p>
                                      <p className="text-sm text-foreground">{session.failed_actions}</p>
                                    </div>
                                  )}
                                  {session.support_needed && (
                                    <div className="p-3 rounded-lg bg-background/50">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">4. Suporte Necessário</p>
                                      <p className="text-sm text-foreground">{session.support_needed}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Notas, Gravação e Áudio */}
                              {(session.recording_url || session.meeting_notes || session.audio_file_path) && (
                                <div className="pt-3 border-t border-border/50 space-y-3">
                                  {session.recording_url && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                      <a
                                        href={session.recording_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-violet-500 hover:text-violet-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Video className="h-4 w-4" />
                                        Ver Gravação da Reunião
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isRemovingRecording}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Remover link da gravação?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Isso irá remover apenas o link da gravação externa. A FIVI e outras informações serão mantidas.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              onClick={() => removeRecording(session.id)}
                                            >
                                              Remover
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}

                                  {session.audio_file_path && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePlayAudio(session.id, session.audio_file_path!);
                                        }}
                                        className="h-8 w-8 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                                      >
                                        {playingAudioId === session.id ? (
                                          <Pause className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4 ml-0.5" />
                                        )}
                                      </Button>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">Áudio da Reunião</p>
                                        <p className="text-xs text-muted-foreground">
                                          {playingAudioId === session.id ? 'Reproduzindo...' : 'Clique para ouvir'}
                                        </p>
                                      </div>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isRemovingAudio}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir áudio?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              O arquivo de áudio será permanentemente excluído. A FIVI e outras informações serão mantidas.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              onClick={() => removeAudioFromSession({ id: session.id, filePath: session.audio_file_path! })}
                                            >
                                              Excluir
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}

                                  {session.meeting_notes && (
                                    <div className="p-3 rounded-lg bg-background/50">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Notas da Reunião</p>
                                      <p className="text-sm text-foreground whitespace-pre-wrap">{session.meeting_notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Ações */}
                              <div className="flex justify-end pt-3 border-t border-border/50">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir FIVI?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta FIVI de {session.salesperson_name} (Semana {session.week_number})?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => handleDeleteSession(session)}
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudioId(null)}
        onError={() => {
          toast.error('Erro ao reproduzir áudio');
          setPlayingAudioId(null);
        }}
        className="hidden"
      />
    </motion.div>
  );
};

export default FIVIView;
