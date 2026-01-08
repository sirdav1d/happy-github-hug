import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Users, 
  DollarSign,
  BarChart3,
  Zap,
  RefreshCw,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardData } from "@/types";
import { cn } from "@/lib/utils";
import { useIrisInsights, AIInsight } from "@/hooks/useIrisInsights";

interface InsightsViewProps {
  data: DashboardData;
}

const categoryConfig: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  performance: { icon: BarChart3, label: 'Performance', color: 'text-blue-500' },
  growth: { icon: TrendingUp, label: 'Crescimento', color: 'text-emerald-500' },
  efficiency: { icon: Target, label: 'Eficiência', color: 'text-purple-500' },
  team: { icon: Users, label: 'Equipe', color: 'text-orange-500' },
  opportunity: { icon: Lightbulb, label: 'Oportunidade', color: 'text-amber-500' },
};

const typeConfig: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    icon: 'text-destructive',
    badge: 'bg-destructive/20 text-destructive',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    icon: 'text-primary',
    badge: 'bg-primary/20 text-primary',
  },
};

const getTypeIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'success': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'danger': return TrendingDown;
    default: return Zap;
  }
};

const InsightsView = ({ data }: InsightsViewProps) => {
  const { insights, isLoading, error, fetchInsights, lastUpdated } = useIrisInsights();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get current year from data
  const selectedYear = data.currentYearData[0]?.year || new Date().getFullYear();

  useEffect(() => {
    if (data) {
      fetchInsights(data, selectedYear);
    }
  }, [data, selectedYear, fetchInsights]);

  const handleRefresh = () => {
    // Clear cache and refetch
    localStorage.removeItem('iris_insights_cache');
    fetchInsights(data, selectedYear);
  };

  const filteredInsights = selectedCategory 
    ? insights.filter(i => i.category === selectedCategory)
    : insights;

  const categories = [...new Set(insights.map(i => i.category))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with IRIS branding */}
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
              IRIS Insights
              <Badge variant="outline" className="text-xs font-normal bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                IA
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Análises inteligentes personalizadas para seu negócio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Category filters */}
      {categories.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="text-xs"
          >
            Todos ({insights.length})
          </Button>
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const count = insights.filter(i => i.category === cat).length;
            const Icon = config?.icon || Zap;
            
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="text-xs gap-1.5"
              >
                <Icon className={cn("h-3.5 w-3.5", selectedCategory !== cat && config?.color)} />
                {config?.label || cat} ({count})
              </Button>
            );
          })}
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative p-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">IRIS está analisando seus dados...</p>
        </motion.div>
      )}

      {/* Error state */}
      {error && !isLoading && insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Não foi possível gerar insights
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Tentar novamente
          </Button>
        </motion.div>
      )}

      {/* Insights Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((insight, index) => {
            const styles = typeConfig[insight.type] || typeConfig.info;
            const TypeIcon = getTypeIcon(insight.type);
            const CategoryIcon = categoryConfig[insight.category]?.icon || Zap;

            return (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "border h-full transition-all duration-200 hover:shadow-lg",
                  styles.bg, 
                  styles.border,
                  "hover:border-opacity-40"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2.5 rounded-xl", styles.bg)}>
                        <TypeIcon className={cn("h-5 w-5", styles.icon)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground leading-tight">
                            {insight.title}
                          </h3>
                          {insight.metric && (
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                              styles.badge
                            )}>
                              {insight.metric}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {insight.description}
                        </p>

                        {/* Action item */}
                        {insight.actionable && (
                          <div className="flex items-center gap-2 text-xs">
                            <ArrowRight className="h-3.5 w-3.5 text-primary" />
                            <span className="text-primary font-medium">
                              {insight.actionable}
                            </span>
                          </div>
                        )}

                        {/* Category badge */}
                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
                          <CategoryIcon className={cn("h-3.5 w-3.5", categoryConfig[insight.category]?.color || 'text-muted-foreground')} />
                          <span className="text-xs text-muted-foreground">
                            {categoryConfig[insight.category]?.label || insight.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty state */}
      {!isLoading && !error && filteredInsights.length === 0 && insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum insight nesta categoria
          </h3>
          <p className="text-muted-foreground">
            Selecione outra categoria ou veja todos os insights.
          </p>
        </motion.div>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Adicione dados para gerar insights
          </h3>
          <p className="text-muted-foreground">
            IRIS precisa de dados de vendas para analisar e gerar recomendações.
          </p>
        </motion.div>
      )}

      {/* Footer attribution */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span>Análise gerada por IRIS • Inteligência de Resultados e Insights Estratégicos</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InsightsView;
