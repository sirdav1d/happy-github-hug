import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardData, ViewState } from "@/types";
import { Lead } from "@/types/leads";
import { cn } from "@/lib/utils";
import { useIrisInsights } from "@/hooks/useIrisInsights";
import { useIRISCommandCenter } from "@/hooks/useIRISCommandCenter";
import GlobalHealthScore from "./insights/GlobalHealthScore";
import AreaDiagnosticCard from "./insights/AreaDiagnosticCard";
import ProactiveAlerts from "./insights/ProactiveAlerts";
import AIRecommendations from "./insights/AIRecommendations";

interface InsightsViewProps {
  data: DashboardData;
  leads?: Lead[];
  leadsLoading?: boolean;
  onNavigate?: (view: ViewState) => void;
}

const InsightsView = ({ data, leads = [], leadsLoading = false, onNavigate }: InsightsViewProps) => {
  const { insights, isLoading: insightsLoading, fetchInsights, lastUpdated } = useIrisInsights();
  
  const commandData = useIRISCommandCenter({
    dashboardData: data,
    leads,
    leadsLoading,
  });

  const selectedYear = data.currentYearData[0]?.year || new Date().getFullYear();

  useEffect(() => {
    if (data) {
      fetchInsights(data, selectedYear);
    }
  }, [data, selectedYear, fetchInsights]);

  const handleRefresh = () => {
    localStorage.removeItem('iris_insights_cache');
    fetchInsights(data, selectedYear);
  };

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view as ViewState);
    }
  };

  const handleAreaClick = (area: 'vendas' | 'pipeline' | 'equipe' | 'eficiencia') => {
    const viewMap: Record<string, ViewState> = {
      vendas: 'dashboard',
      pipeline: 'pipeline',
      equipe: 'team',
      eficiencia: 'dashboard',
    };
    if (onNavigate) {
      onNavigate(viewMap[area]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-lg opacity-50" />
            <div className="relative p-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              IRIS Central de Comando
              <Badge variant="outline" className="text-xs font-normal bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                IA
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Visão unificada da saúde do seu negócio
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={insightsLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", insightsLoading && "animate-spin")} />
          Atualizar
        </Button>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Health Score + Areas */}
        <div className="lg:col-span-5 space-y-6">
          {/* Global Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border p-6 flex justify-center"
          >
            <GlobalHealthScore
              score={commandData.globalHealthScore}
              status={commandData.globalStatus}
              isLoading={commandData.isLoading}
            />
          </motion.div>

          {/* Area Diagnostic Cards */}
          <div className="grid grid-cols-2 gap-3">
            <AreaDiagnosticCard
              area="vendas"
              data={commandData.areaScores.vendas}
              onClick={() => handleAreaClick('vendas')}
              delay={0.2}
            />
            <AreaDiagnosticCard
              area="pipeline"
              data={commandData.areaScores.pipeline}
              onClick={() => handleAreaClick('pipeline')}
              delay={0.25}
            />
            <AreaDiagnosticCard
              area="equipe"
              data={commandData.areaScores.equipe}
              onClick={() => handleAreaClick('equipe')}
              delay={0.3}
            />
            <AreaDiagnosticCard
              area="eficiencia"
              data={commandData.areaScores.eficiencia}
              onClick={() => handleAreaClick('eficiencia')}
              delay={0.35}
            />
          </div>
        </div>

        {/* Right Column: Alerts + Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Proactive Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ProactiveAlerts
              alerts={commandData.prioritizedAlerts}
              onNavigate={handleNavigate}
            />
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <AIRecommendations
              insights={insights}
              isLoading={insightsLoading}
              onRefresh={handleRefresh}
              lastUpdated={lastUpdated}
            />
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4"
      >
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        <span>Análise em tempo real por IRIS • Inteligência de Resultados e Insights Estratégicos</span>
      </motion.div>
    </motion.div>
  );
};

export default InsightsView;
