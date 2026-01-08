import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AIInsight } from '@/hooks/useIrisInsights';

interface AIRecommendationsProps {
  insights: AIInsight[];
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null;
}

const categoryIcons = {
  performance: Target,
  growth: TrendingUp,
  efficiency: Lightbulb,
  team: Users,
  opportunity: Sparkles,
};

const priorityColors = {
  1: 'bg-red-500/10 border-red-500/30 text-red-500',
  2: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  3: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
};

const AIRecommendations = ({ insights, isLoading, onRefresh, lastUpdated }: AIRecommendationsProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Take top 5 recommendations
  const topInsights = insights.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            Recomendações IRIS
            <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
              IA
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && topInsights.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-8 w-8 text-violet-500" />
            </motion.div>
            <p className="mt-3 text-sm text-muted-foreground">
              IRIS está analisando...
            </p>
          </div>
        ) : topInsights.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma recomendação disponível</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {topInsights.map((insight, index) => {
              const isExpanded = expandedId === insight.id;
              const CategoryIcon = categoryIcons[insight.category] || Lightbulb;
              const priorityClass = priorityColors[Math.min(3, insight.priority) as keyof typeof priorityColors];

              return (
                <motion.div
                  key={insight.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "rounded-lg border overflow-hidden transition-all duration-200",
                    isExpanded ? "bg-card" : "bg-card/50",
                    "hover:shadow-sm"
                  )}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <div className={cn("p-1.5 rounded-md border", priorityClass)}>
                      <CategoryIcon className="h-3.5 w-3.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground line-clamp-1">
                          {insight.title}
                        </span>
                        {insight.metric && (
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {insight.description}
                        </p>
                      )}
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t"
                      >
                        <div className="p-3 pt-2 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {insight.description}
                          </p>
                          {insight.actionable && (
                            <div className="flex items-center gap-2 text-xs text-primary">
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-medium">{insight.actionable}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Footer */}
        {topInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-2 text-center"
          >
            <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-violet-500" />
              Análise por IRIS • Atualizado em tempo real
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
