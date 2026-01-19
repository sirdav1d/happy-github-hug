import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  Pencil, 
  Trash2, 
  Star,
  StarOff,
  Settings2,
  TrendingUp,
  Calendar,
  Users,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGoalRules, GoalRule } from '@/hooks/useGoalRules';
import { GoalRuleForm } from './GoalRuleForm';

const baseReferenceLabels: Record<string, string> = {
  previous_year_same_month: 'Mesmo mês do ano anterior',
  previous_month: 'Mês anterior',
  team_average: 'Média da equipe',
  manual: 'Definição manual',
};

const newHireStrategyLabels: Record<string, string> = {
  team_average: 'Média da equipe',
  fixed_rampup: 'Ramp-up progressivo',
  manual: 'Definição manual',
  no_goal: 'Sem meta inicial',
};

interface GoalRulesSettingsProps {
  showHeader?: boolean;
}

export function GoalRulesSettings({ showHeader = true }: GoalRulesSettingsProps) {
  const { 
    goalRules, 
    isLoading, 
    deleteGoalRule, 
    setDefaultRule,
    formatRuleDescription,
    ensureDefaultRule,
  } = useGoalRules();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<GoalRule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create default rule if none exists
  if (!isLoading && goalRules.length === 0) {
    ensureDefaultRule();
  }

  const handleEdit = (rule: GoalRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteGoalRule(deletingId);
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultRule(id);
  };

  const renderRuleCard = (rule: GoalRule) => (
    <motion.div
      key={rule.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={rule.is_default ? 'border-primary/50 bg-primary/5' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{rule.name}</CardTitle>
              {rule.is_default && (
                <Badge variant="default" className="ml-2">
                  Padrão
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!rule.is_default && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleSetDefault(rule.id)}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Definir como padrão</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleEdit(rule)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!rule.is_default && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDeletingId(rule.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {rule.description && (
            <CardDescription>{rule.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Rule Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Tipo de Cálculo
              </p>
              <p className="font-medium text-sm">
                {rule.rule_type === 'percentage' 
                  ? `+${rule.percentage_value}%`
                  : rule.rule_type === 'fixed'
                  ? `R$ ${rule.fixed_value?.toLocaleString('pt-BR')}`
                  : 'Manual'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Base de Referência
              </p>
              <p className="font-medium text-sm">
                {baseReferenceLabels[rule.base_reference]}
              </p>
            </div>
          </div>

          {/* New Hire Strategy */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Vendedores Novos</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Estratégia</p>
                <p>{newHireStrategyLabels[rule.new_hire_strategy]}</p>
              </div>
              {rule.new_hire_strategy === 'fixed_rampup' && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p>{rule.rampup_months} meses</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% Inicial</p>
                    <p>{rule.rampup_start_percent}%</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Resumo</p>
            <p className="text-sm font-medium">{formatRuleDescription(rule)}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Regras de Metas
            </h2>
            <p className="text-muted-foreground mt-1">
              Configure como as metas são calculadas para sua equipe
            </p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-600 mb-1">Como funciona</p>
            <p className="text-muted-foreground">
              A regra marcada como <Badge variant="default" className="mx-1">Padrão</Badge> 
              será aplicada automaticamente a todos os vendedores que não possuem uma regra personalizada.
              Você pode definir regras específicas para cada vendedor na tela de Gestão de Vendedores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rules Grid */}
      {goalRules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhuma regra cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie sua primeira regra de metas para começar
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {goalRules.map(renderRuleCard)}
          </AnimatePresence>
        </div>
      )}

      {/* Form Modal */}
      <GoalRuleForm
        open={showForm}
        onOpenChange={handleCloseForm}
        rule={editingRule}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra de meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Vendedores que usam esta regra passarão a usar a regra padrão.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
