import { motion } from "framer-motion";
import { Trophy, Calendar, Star, Target, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InfoTooltip from "../InfoTooltip";

interface RMRViewProps {
  team?: any[];
}

const RMRView = ({ team = [] }: RMRViewProps) => {
  // Mock data para a próxima RMR
  const nextRMR = {
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    status: 'pending' as const,
  };

  const previousRMRs = [
    {
      id: '1',
      month: 'Dezembro',
      year: 2024,
      status: 'completed',
      highlightedEmployee: 'Carlos Silva',
      revenue: 285000,
      goal: 250000,
    },
    {
      id: '2',
      month: 'Novembro',
      year: 2024,
      status: 'completed',
      highlightedEmployee: 'Ana Costa',
      revenue: 245000,
      goal: 240000,
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const daysUntilRMR = Math.ceil((nextRMR.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            RMR - Reunião de Metas e Reconhecimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Ritual mensal de alinhamento, celebração e definição de metas
          </p>
        </div>
        <InfoTooltip 
          text="A RMR acontece todo 1º dia útil do mês. É o momento de celebrar resultados, reconhecer destaques e alinhar as metas do próximo período."
          maxWidth={320}
        />
      </div>

      {/* Próxima RMR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Próxima RMR
              </CardTitle>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                Em {daysUntilRMR} dias
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground capitalize">
                  {formatDate(nextRMR.date)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  1º dia útil do mês
                </p>
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                Preparar RMR
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Checklist de Preparação */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              {[
                { label: 'Resultados do Mês', icon: Target, done: true },
                { label: 'Colaborador Destaque', icon: Star, done: false },
                { label: 'Tema Motivacional', icon: Trophy, done: false },
                { label: 'Metas do Próximo Mês', icon: Calendar, done: false },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.done ? 'bg-emerald-500/10' : 'bg-secondary/50'
                  }`}
                >
                  {item.done ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm font-medium ${
                    item.done ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                RMRs Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                12
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                nos últimos 12 meses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Cumprimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                92%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                das metas foram atingidas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Destaques do Ano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {team.length > 0 ? team.length : 3}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                colaboradores reconhecidos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Histórico de RMRs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Histórico de Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousRMRs.map((rmr, idx) => (
                <motion.div
                  key={rmr.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {rmr.month} {rmr.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Destaque: {rmr.highlightedEmployee}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                      }).format(rmr.revenue)}
                    </p>
                    <p className={`text-sm ${rmr.revenue >= rmr.goal ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {((rmr.revenue / rmr.goal) * 100).toFixed(0)}% da meta
                    </p>
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

export default RMRView;
