import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBehavioralProfiles } from '@/hooks/useBehavioralProfiles';
import { useSalespeople } from '@/hooks/useSalespeople';
import { useMentorshipPhase } from '@/hooks/useMentorshipPhase';
import { useAuth } from '@/contexts/AuthContext';
import { DISCQuestionnaire } from './DISCQuestionnaire';
import { ValuesQuestionnaire } from './ValuesQuestionnaire';
import { DISCRadarChart } from './DISCRadarChart';
import { ValuesBarChart } from './ValuesBarChart';
import { BehavioralConversation } from './BehavioralConversation';
import { ManualProfileEntry } from './ManualProfileEntry';
import { InnermetrixImport } from './InnermetrixImport';
import { TeamBehavioralMap } from './TeamBehavioralMap';
import { differenceInMonths } from 'date-fns';
import { 
  Brain, 
  Settings2, 
  UserPlus, 
  ClipboardList, 
  Mic, 
  FileUp, 
  PenLine,
  Users,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  Lock,
  Map,
  Trash2,
  RefreshCw,
  Clock,
  Info,
  Award,
  ShieldOff
} from 'lucide-react';
import type { DISCResponse, ValuesResponse, BehavioralProfile, DISCScores, ValuesScores, AttributeScores } from '@/types/behavioral';
import { CONFIDENCE_LEVELS } from '@/types/behavioral';
import { toast } from 'sonner';
import { Heart, Target } from 'lucide-react';

// Helper para calcular idade do perfil
const getProfileAge = (createdAt: string) => {
  const months = differenceInMonths(new Date(), new Date(createdAt));
  if (months < 6) return { status: 'fresh', label: 'Atualizado', color: 'emerald', months };
  if (months < 12) return { status: 'aging', label: 'Reavaliar em breve', color: 'amber', months };
  return { status: 'stale', label: 'Reavaliação sugerida', color: 'red', months };
};

// Helper para obter o badge de confiança baseado na fonte
const getConfidenceBadge = (source: string, confidenceScore: number | null) => {
  const level = CONFIDENCE_LEVELS[source] || CONFIDENCE_LEVELS.manual;
  const score = confidenceScore || level.min;
  
  const sourceLabels: Record<string, string> = {
    innermetrix: 'Innermetrix',
    innermetrix_pdf: 'Innermetrix',
    questionnaire: 'Questionário',
    conversation: 'Conversa IA',
    manual: 'Manual',
    hybrid: 'Híbrido',
  };

  return {
    label: level.label,
    sourceLabel: sourceLabels[source] || source,
    color: level.color,
    score,
  };
};

export const BehavioralView: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { hasBehavioralAccess } = useMentorshipPhase();
  const isConsultant = userProfile?.role === 'consultant';
  
  const { 
    moduleConfig, 
    profiles, 
    isLoading,
    isModuleEnabled,
    toggleModule,
    updateConfig,
    createProfileFromDISC,
    addValuesToProfile,
    updateProfile,
    deleteProfile,
    isToggling,
    isCreating,
    createManualProfile,
    isCreatingManual,
    isDeleting
  } = useBehavioralProfiles();
  
  const { salespeople } = useSalespeople();
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createMethod, setCreateMethod] = useState<'innermetrix' | 'questionnaire' | 'conversation' | 'manual' | null>(null);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('');
  const [showDISCQuestionnaire, setShowDISCQuestionnaire] = useState(false);
  const [showValuesQuestionnaire, setShowValuesQuestionnaire] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showInnermetrixImport, setShowInnermetrixImport] = useState(false);
  const [currentCreatedProfileId, setCurrentCreatedProfileId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BehavioralProfile | null>(null);
  
  // Vendedores sem perfil comportamental
  const salespeopleWithoutProfile = salespeople?.filter(sp => 
    sp.status === 'active' && !profiles.find(p => p.salespersonId === sp.id)
  ) || [];

  const handleToggleModule = () => {
    toggleModule(!isModuleEnabled);
  };

  const handleCreateProfile = () => {
    if (!selectedSalespersonId) return;
    setShowCreateDialog(false);
    
    if (createMethod === 'innermetrix') {
      setShowInnermetrixImport(true);
    } else if (createMethod === 'questionnaire') {
      setShowDISCQuestionnaire(true);
    } else if (createMethod === 'conversation') {
      setShowConversation(true);
    } else if (createMethod === 'manual') {
      setShowManualEntry(true);
    }
  };

  const handleDISCComplete = (responses: DISCResponse[]) => {
    createProfileFromDISC(
      { salespersonId: selectedSalespersonId, responses },
      {
        onSuccess: () => {
          setShowDISCQuestionnaire(false);
          const newProfile = profiles.find(p => p.salespersonId === selectedSalespersonId);
          if (newProfile) {
            setCurrentCreatedProfileId(newProfile.id);
            setShowValuesQuestionnaire(true);
          }
        }
      }
    );
  };

  const handleValuesComplete = (responses: ValuesResponse[]) => {
    if (!currentCreatedProfileId) return;
    addValuesToProfile(
      { profileId: currentCreatedProfileId, responses },
      {
        onSuccess: () => {
          setShowValuesQuestionnaire(false);
          setCurrentCreatedProfileId(null);
          setSelectedSalespersonId('');
          setCreateMethod(null);
        }
      }
    );
  };

  const handleConversationComplete = (result: {
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    aiSummary: string;
    transcription: string;
  }) => {
    createManualProfile(
      {
        salespersonId: selectedSalespersonId,
        discScores: result.discScores,
        valuesScores: result.valuesScores,
        source: 'conversation' as 'manual' | 'innermetrix',
        aiSummary: result.aiSummary,
      },
      {
        onSuccess: () => {
          setShowConversation(false);
          setSelectedSalespersonId('');
          setCreateMethod(null);
        }
      }
    );
  };

  const handleManualComplete = (result: {
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    source: 'manual' | 'innermetrix';
  }) => {
    createManualProfile(
      {
        salespersonId: selectedSalespersonId,
        discScores: result.discScores,
        valuesScores: result.valuesScores,
        source: result.source,
      },
      {
        onSuccess: () => {
          setShowManualEntry(false);
          setSelectedSalespersonId('');
          setCreateMethod(null);
        }
      }
    );
  };

  const handleInnermetrixComplete = (result: {
    discScores: DISCScores;
    valuesScores?: ValuesScores;
    attributeScores?: AttributeScores;
    source: 'innermetrix';
  }) => {
    createManualProfile(
      {
        salespersonId: selectedSalespersonId,
        discScores: result.discScores,
        valuesScores: result.valuesScores,
        attributeScores: result.attributeScores,
        source: result.source,
      },
      {
        onSuccess: () => {
          setShowInnermetrixImport(false);
          setSelectedSalespersonId('');
          setCreateMethod(null);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Carregando módulo...</div>
      </div>
    );
  }

  // Check consultant access permission (only for business_owner role)
  const hasAccessPermission = hasBehavioralAccess(user?.id);
  
  if (!isConsultant && !hasAccessPermission) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-7 w-7 text-violet-500" />
              Análise Comportamental
            </h1>
            <p className="text-muted-foreground mt-1">
              Entenda o perfil DISC e os motivadores da sua equipe
            </p>
          </div>
        </div>

        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="py-12">
            <div className="text-center max-w-lg mx-auto space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <ShieldOff className="h-10 w-10 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Acesso Não Liberado</h2>
                <p className="text-muted-foreground">
                  O acesso a este módulo ainda não foi liberado pelo seu mentor. 
                  Entre em contato com seu consultor para solicitar a liberação do módulo de Análise Comportamental.
                </p>
              </div>

              <Alert className="text-left">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  O módulo de Análise Comportamental permite mapear o perfil DISC e os motivadores de cada 
                  vendedor, personalizando feedbacks e potencializando resultados.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Módulo desativado
  if (!isModuleEnabled) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-7 w-7 text-violet-500" />
              Análise Comportamental
            </h1>
            <p className="text-muted-foreground mt-1">
              Entenda o perfil DISC e os motivadores da sua equipe
            </p>
          </div>
        </div>

        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="py-12">
            <div className="text-center max-w-lg mx-auto space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
                <Brain className="h-10 w-10 text-violet-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Módulo Desativado</h2>
                <p className="text-muted-foreground">
                  Ative o módulo de Análise Comportamental para mapear o perfil DISC e os motivadores 
                  de cada vendedor, personalizando feedbacks e potencializando resultados.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-lg bg-card border">
                  <ClipboardList className="h-5 w-5 text-primary mb-2" />
                  <h3 className="font-medium text-sm">Questionário DISC</h3>
                  <p className="text-xs text-muted-foreground">Mapeamento rápido em 10 minutos</p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                  <Mic className="h-5 w-5 text-emerald-500 mb-2" />
                  <h3 className="font-medium text-sm">Conversa com IA</h3>
                  <p className="text-xs text-muted-foreground">Análise via gravação de áudio</p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                  <Sparkles className="h-5 w-5 text-amber-500 mb-2" />
                  <h3 className="font-medium text-sm">Insights Personalizados</h3>
                  <p className="text-xs text-muted-foreground">FIVIs e RMRs sob medida</p>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleToggleModule}
                disabled={isToggling}
                className="gap-2"
              >
                {isToggling ? 'Ativando...' : 'Ativar Módulo'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Módulo ativado
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-violet-500" />
            Análise Comportamental
          </h1>
          <p className="text-muted-foreground mt-1">
            Mapeamento DISC e motivadores da equipe
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Ativo
          </Badge>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Perfil Comportamental</DialogTitle>
                <DialogDescription>
                  Escolha o vendedor e o método de coleta do perfil
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {salespeopleWithoutProfile.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Todos os vendedores ativos já possuem perfil comportamental.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Vendedor</Label>
                      <Select 
                        value={selectedSalespersonId} 
                        onValueChange={setSelectedSalespersonId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {salespeopleWithoutProfile.map(sp => (
                            <SelectItem key={sp.id} value={sp.id}>
                              {sp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Método de Coleta</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Innermetrix - Recomendado */}
                        <button
                          onClick={() => setCreateMethod('innermetrix')}
                          className={`p-4 rounded-lg border text-left transition-all relative ${
                            createMethod === 'innermetrix' 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <Badge className="absolute top-2 right-2 gap-1 bg-primary/90">
                            <Sparkles className="h-3 w-3" />
                            Recomendado
                          </Badge>
                          <div className="flex items-start gap-3">
                            <Award className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Relatório Innermetrix</div>
                              <div className="text-xs text-muted-foreground">
                                Tenho o PDF oficial ou texto do relatório
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {/* Questionário - Alternativa */}
                        <button
                          onClick={() => setCreateMethod('questionnaire')}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            createMethod === 'questionnaire' 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <ClipboardList className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                Questionário Simplificado
                                <Badge variant="outline" className="text-[10px] py-0">Alternativa</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ~10 min • Gerar aproximação por perguntas DISC + Values
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {/* Conversa com IA */}
                        <button
                          onClick={() => setCreateMethod('conversation')}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            createMethod === 'conversation' 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Mic className="h-5 w-5 text-emerald-500 mt-0.5" />
                            <div>
                              <div className="font-medium">Análise por Conversa (IA)</div>
                              <div className="text-xs text-muted-foreground">
                                ~20 min • Inferir perfil a partir de áudio ou transcrição
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {/* Entrada de Valores - Avançado */}
                        <button
                          onClick={() => setCreateMethod('manual')}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            createMethod === 'manual' 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <PenLine className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                Entrada de Valores
                                <Badge variant="outline" className="text-[10px] py-0 text-amber-600 border-amber-500/50">Avançado</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Já conheço os valores numéricos (0-100)
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCreateProfile}
                      disabled={!selectedSalespersonId || !createMethod}
                      className="w-full"
                    >
                      {createMethod === 'innermetrix' ? 'Importar Relatório' :
                       createMethod === 'questionnaire' ? 'Iniciar Questionário' : 
                       createMethod === 'conversation' ? 'Iniciar Análise por Conversa' : 
                       createMethod === 'manual' ? 'Inserir Valores' : 'Selecione um método'}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{profiles.length}</div>
            <div className="text-sm text-muted-foreground">Perfis Mapeados</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{salespeopleWithoutProfile.length}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.discNatural && p.values).length}
            </div>
            <div className="text-sm text-muted-foreground">Perfis Completos</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {Math.round(profiles.reduce((acc, p) => acc + (p.confidenceScore || 0), 0) / (profiles.length || 1))}%
            </div>
            <div className="text-sm text-muted-foreground">Confiança Média</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Users className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" />
            Mapa da Equipe
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6">
          <TeamBehavioralMap 
            profiles={profiles} 
            salespeople={salespeople || []} 
          />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          {profiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nenhum perfil mapeado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece criando o primeiro perfil comportamental da equipe
                </p>
                <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Primeiro Perfil
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {profiles.map(profile => {
                const salesperson = salespeople?.find(sp => sp.id === profile.salespersonId);
                const profileAge = getProfileAge(profile.createdAt);
                const confidenceBadge = getConfidenceBadge(profile.source, profile.confidenceScore);
                
                return (
                  <Card 
                    key={profile.id} 
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {salesperson?.name || 'Vendedor'}
                        </CardTitle>
                        <div className="flex items-center gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={`gap-1 text-[10px] ${
                                  profileAge.status === 'fresh' 
                                    ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10' 
                                    : profileAge.status === 'aging' 
                                    ? 'border-amber-500/50 text-amber-600 bg-amber-500/10' 
                                    : 'border-red-500/50 text-red-600 bg-red-500/10'
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                {profileAge.months}m
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">{profileAge.label}</p>
                              <p className="text-xs opacity-80">
                                Perfil criado há {profileAge.months} {profileAge.months === 1 ? 'mês' : 'meses'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      {/* Confidence Badge */}
                      <div className="flex items-center gap-2 mt-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`gap-1 text-[10px] ${
                                confidenceBadge.color === 'emerald' 
                                  ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10' 
                                  : confidenceBadge.color === 'amber'
                                  ? 'border-amber-500/50 text-amber-600 bg-amber-500/10'
                                  : confidenceBadge.color === 'blue'
                                  ? 'border-blue-500/50 text-blue-600 bg-blue-500/10'
                                  : confidenceBadge.color === 'violet'
                                  ? 'border-violet-500/50 text-violet-600 bg-violet-500/10'
                                  : 'border-slate-500/50 text-slate-600 bg-slate-500/10'
                              }`}
                            >
                              {confidenceBadge.score}% • {confidenceBadge.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[250px]">
                            <p className="font-medium">Nível de Confiança: {confidenceBadge.score}%</p>
                            <p className="text-xs opacity-80">
                              Fonte: {confidenceBadge.sourceLabel}
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {confidenceBadge.color === 'emerald' 
                                ? 'Dados de alta precisão do relatório Innermetrix oficial'
                                : confidenceBadge.color === 'amber'
                                ? 'Aproximação gerada pelo questionário simplificado'
                                : confidenceBadge.color === 'blue'
                                ? 'Inferência gerada por análise de IA de conversa'
                                : 'Dados inseridos manualmente'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        {/* Pillar Badges */}
                        <div className="flex gap-1 ml-auto">
                          {profile.discNatural && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="p-1 border-violet-500/50">
                                  <Brain className="h-3 w-3 text-violet-500" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>DISC disponível</TooltipContent>
                            </Tooltip>
                          )}
                          {profile.values && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="p-1 border-amber-500/50">
                                  <Heart className="h-3 w-3 text-amber-500" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Motivadores disponíveis</TooltipContent>
                            </Tooltip>
                          )}
                          {profile.attributes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="p-1 border-blue-500/50">
                                  <Target className="h-3 w-3 text-blue-500" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Attribute Index disponível</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32">
                          {profile.discNatural ? (
                            <DISCRadarChart 
                              natural={profile.discNatural} 
                              size="sm"
                              showLegend={false}
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                              DISC pendente
                            </div>
                          )}
                        </div>
                        <div className="h-32">
                          {profile.values ? (
                            <ValuesBarChart 
                              values={profile.values} 
                              size="sm"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                              Values pendente
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full mt-2 gap-2">
                        <Eye className="h-3.5 w-3.5" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Módulo</CardTitle>
              <CardDescription>
                Controle onde as informações comportamentais aparecem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Módulo Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar/desativar todo o módulo comportamental
                  </p>
                </div>
                <Switch 
                  checked={isModuleEnabled} 
                  onCheckedChange={handleToggleModule}
                  disabled={isToggling}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exibir na Visão de Equipe</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar indicadores DISC no ranking
                  </p>
                </div>
                <Switch 
                  checked={moduleConfig?.show_in_team_view ?? true}
                  onCheckedChange={(checked) => updateConfig({ show_in_team_view: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Insights no FIVI</Label>
                  <p className="text-sm text-muted-foreground">
                    Sugestões personalizadas por perfil no feedback
                  </p>
                </div>
                <Switch 
                  checked={moduleConfig?.show_in_fivi ?? true}
                  onCheckedChange={(checked) => updateConfig({ show_in_fivi: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reconhecimento no RMR</Label>
                  <p className="text-sm text-muted-foreground">
                    Adaptar tipo de reconhecimento ao perfil
                  </p>
                </div>
                <Switch 
                  checked={moduleConfig?.show_in_rmr ?? true}
                  onCheckedChange={(checked) => updateConfig({ show_in_rmr: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Questionário DISC Dialog */}
      <Dialog open={showDISCQuestionnaire} onOpenChange={setShowDISCQuestionnaire}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questionário DISC</DialogTitle>
            <DialogDescription>
              Para cada bloco, escolha a opção que MAIS te descreve e a que MENOS te descreve
            </DialogDescription>
          </DialogHeader>
          <DISCQuestionnaire 
            onComplete={handleDISCComplete}
            onCancel={() => setShowDISCQuestionnaire(false)}
            salespersonName={salespeople?.find(sp => sp.id === selectedSalespersonId)?.name}
          />
        </DialogContent>
      </Dialog>

      {/* Questionário Values Dialog */}
      <Dialog open={showValuesQuestionnaire} onOpenChange={setShowValuesQuestionnaire}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questionário de Motivadores</DialogTitle>
            <DialogDescription>
              Ordene as opções da mais importante (1) para menos importante (4)
            </DialogDescription>
          </DialogHeader>
          <ValuesQuestionnaire 
            onComplete={handleValuesComplete}
            onCancel={() => setShowValuesQuestionnaire(false)}
            salespersonName={salespeople?.find(sp => sp.id === selectedSalespersonId)?.name}
          />
        </DialogContent>
      </Dialog>

      {/* Conversation Dialog */}
      <Dialog open={showConversation} onOpenChange={setShowConversation}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análise por Conversa</DialogTitle>
            <DialogDescription>
              Faça upload de um áudio ou insira a transcrição manualmente
            </DialogDescription>
          </DialogHeader>
          <BehavioralConversation 
            salespersonId={selectedSalespersonId}
            salespersonName={salespeople?.find(sp => sp.id === selectedSalespersonId)?.name || ''}
            onComplete={handleConversationComplete}
            onCancel={() => {
              setShowConversation(false);
              setSelectedSalespersonId('');
              setCreateMethod(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Entrada Manual / PDF</DialogTitle>
            <DialogDescription>
              Insira os valores manualmente ou importe um relatório Innermetrix
            </DialogDescription>
          </DialogHeader>
          <ManualProfileEntry 
            salespersonName={salespeople?.find(sp => sp.id === selectedSalespersonId)?.name || ''}
            onComplete={handleManualComplete}
            onCancel={() => {
              setShowManualEntry(false);
              setSelectedSalespersonId('');
              setCreateMethod(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Innermetrix Import Dialog */}
      <Dialog open={showInnermetrixImport} onOpenChange={setShowInnermetrixImport}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Relatório Innermetrix</DialogTitle>
            <DialogDescription>
              Faça upload do PDF ou cole o texto do relatório oficial
            </DialogDescription>
          </DialogHeader>
          <InnermetrixImport 
            salespersonName={salespeople?.find(sp => sp.id === selectedSalespersonId)?.name || ''}
            onComplete={handleInnermetrixComplete}
            onCancel={() => {
              setShowInnermetrixImport(false);
              setSelectedSalespersonId('');
              setCreateMethod(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Detail Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Perfil de {salespeople?.find(sp => sp.id === selectedProfile?.salespersonId)?.name}
            </DialogTitle>
            <DialogDescription>
              Análise comportamental completa
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (() => {
            const profileAge = getProfileAge(selectedProfile.createdAt);
            const needsReevaluation = profileAge.status === 'stale';
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Alerta de reavaliação */}
                {needsReevaluation && (
                  <div className="md:col-span-2">
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <RefreshCw className="h-4 w-4 text-red-500" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>
                          Este perfil tem mais de 12 meses. Recomendamos uma reavaliação para manter a precisão.
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="ml-4 gap-1.5 border-red-500/50 text-red-600 hover:bg-red-500/10">
                              <RefreshCw className="h-3.5 w-3.5" />
                              Refazer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Refazer Análise Comportamental</AlertDialogTitle>
                              <AlertDialogDescription>
                                O perfil atual será excluído e você poderá criar um novo perfil para este vendedor. Deseja continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  const salespersonId = selectedProfile.salespersonId;
                                  deleteProfile(selectedProfile.id, {
                                    onSuccess: () => {
                                      setSelectedProfile(null);
                                      setSelectedSalespersonId(salespersonId || '');
                                      setShowCreateDialog(true);
                                      toast.success('Perfil excluído. Selecione o método para novo mapeamento.');
                                    }
                                  });
                                }}
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    Perfil DISC
                  </h3>
                  {selectedProfile.discNatural ? (
                    <div className="h-64">
                      <DISCRadarChart natural={selectedProfile.discNatural} size="lg" />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center border rounded-lg border-dashed">
                      <span className="text-muted-foreground">Não mapeado</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Motivadores
                  </h3>
                  {selectedProfile.values ? (
                    <ValuesBarChart values={selectedProfile.values} />
                  ) : (
                    <div className="h-64 flex items-center justify-center border rounded-lg border-dashed">
                      <span className="text-muted-foreground">Não mapeado</span>
                    </div>
                  )}
                </div>
                
                {selectedProfile.aiSummary && (
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Resumo da IA
                    </h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                      {selectedProfile.aiSummary}
                    </p>
                  </div>
                )}
                
                {/* Footer com metadados e ações */}
                <div className="md:col-span-2 flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Confiança: {selectedProfile.confidenceScore}%</span>
                    <span>•</span>
                    <span>Fonte: {selectedProfile.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {profileAge.months} {profileAge.months === 1 ? 'mês' : 'meses'}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <p className="text-xs">
                          Perfis comportamentais são estáveis, mas recomendamos reavaliação anual ou após mudanças significativas de cargo/ambiente.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir Perfil
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Perfil Comportamental</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O perfil comportamental de{' '}
                          <strong>{salespeople?.find(sp => sp.id === selectedProfile.salespersonId)?.name}</strong>{' '}
                          será permanentemente removido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                          onClick={() => {
                            deleteProfile(selectedProfile.id, {
                              onSuccess: () => {
                                setSelectedProfile(null);
                                toast.success('Perfil excluído com sucesso');
                              }
                            });
                          }}
                        >
                          {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BehavioralView;
