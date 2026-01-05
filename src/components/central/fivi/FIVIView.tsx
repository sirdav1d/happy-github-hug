import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Calendar, Target, TrendingUp, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import InfoTooltip from "../InfoTooltip";
import { Salesperson } from "@/types";

interface FIVIViewProps {
  team: Salesperson[];
}

const FIVIView = ({ team }: FIVIViewProps) => {
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("");
  const [formData, setFormData] = useState({
    actionsExecuted: "",
    improvementIdeas: "",
    failedActions: "",
    supportNeeded: "",
    weeklyCommitment: "",
  });

  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
  const currentWeek = Math.ceil(new Date().getDate() / 7);

  // Mock de feedbacks anteriores
  const previousFeedbacks = [
    {
      id: '1',
      salesperson: 'Carlos Silva',
      date: '23/12/2024',
      weekNumber: 4,
      commitment: 45000,
      realized: 42000,
      status: 'completed'
    },
    {
      id: '2',
      salesperson: 'Ana Costa',
      date: '23/12/2024',
      weekNumber: 4,
      commitment: 38000,
      realized: 41000,
      status: 'completed'
    },
    {
      id: '3',
      salesperson: 'Pedro Santos',
      date: '16/12/2024',
      weekNumber: 3,
      commitment: 35000,
      realized: 28000,
      status: 'completed'
    },
  ];

  const selectedPerson = activeTeam.find(s => s.id === selectedSalesperson);
  const weekData = selectedPerson?.weeks.find(w => w.week === currentWeek);

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
                {activeTeam.length}
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
                12
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
                78%
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
                As 5 Perguntas Estratégicas
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

            {/* Dados do PGV (se vendedor selecionado) */}
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30"
              >
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
              </motion.div>
            )}

            {/* As 5 Perguntas */}
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="space-y-2"
                >
                  <Label className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20 text-violet-500 text-sm font-bold">
                      {q.number}
                    </span>
                    {q.question}
                    <InfoTooltip text={q.tooltip} />
                  </Label>
                  <Textarea
                    placeholder={q.placeholder}
                    value={formData[q.id as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [q.id]: e.target.value })}
                    className="min-h-[80px] resize-none"
                  />
                </motion.div>
              ))}

              {/* Pergunta 5 - Compromisso */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <Label className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-sm font-bold">
                    5
                  </span>
                  Quanto você se compromete a entregar esta semana?
                  <InfoTooltip text="O compromisso deve ser um valor específico. Isso cria responsabilidade e será cobrado na próxima FIVI." />
                </Label>
                <div className="flex items-center gap-4">
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
                  <Button className="bg-violet-500 hover:bg-violet-600 text-white gap-2">
                    Registrar FIVI
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Histórico de Feedbacks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Histórico de FIVIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousFeedbacks.map((feedback, idx) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <User className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {feedback.salesperson}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Semana {feedback.weekNumber} • {feedback.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Compromisso:</span>
                      <span className="font-medium text-foreground">{formatCurrency(feedback.commitment)}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm text-muted-foreground">Entregou:</span>
                      <span className={cn(
                        "font-medium",
                        feedback.realized >= feedback.commitment ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {formatCurrency(feedback.realized)}
                      </span>
                      {feedback.realized >= feedback.commitment ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Target className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default FIVIView;
