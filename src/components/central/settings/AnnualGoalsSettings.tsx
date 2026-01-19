import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Pencil, Trash2, Calendar, TrendingUp, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useAnnualGoals, AnnualGoal } from '@/hooks/useAnnualGoals';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

const formatMonthlyGoal = (annual: number) => formatCurrency(annual / 12);

interface AnnualGoalsSettingsProps {
  showHeader?: boolean;
}

export const AnnualGoalsSettings: React.FC<AnnualGoalsSettingsProps> = ({ showHeader = true }) => {
  const { annualGoals, isLoading, upsertAnnualGoal, deleteAnnualGoal, isSaving } = useAnnualGoals();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AnnualGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form state
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formGoal, setFormGoal] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1];
  const existingYears = annualGoals.map(g => g.year);

  const resetForm = () => {
    setEditingGoal(null);
    setFormYear(currentYear);
    setFormGoal('');
    setFormNotes('');
  };

  const openNewDialog = () => {
    resetForm();
    // Find first available year that doesn't have a goal
    const firstAvailable = availableYears.find(y => !existingYears.includes(y)) || currentYear;
    setFormYear(firstAvailable);
    setIsDialogOpen(true);
  };

  const openEditDialog = (goal: AnnualGoal) => {
    setEditingGoal(goal);
    setFormYear(goal.year);
    setFormGoal(goal.annual_goal.toString());
    setFormNotes(goal.notes || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const goalValue = parseFloat(formGoal.replace(/\D/g, ''));
    if (!goalValue || goalValue <= 0) return;

    await upsertAnnualGoal({
      year: formYear,
      annual_goal: goalValue,
      notes: formNotes || undefined,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteAnnualGoal(deletingId);
    setDeletingId(null);
  };

  const handleGoalInputChange = (value: string) => {
    // Remove non-digits and format
    const numericValue = value.replace(/\D/g, '');
    setFormGoal(numericValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Metas Anuais
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configure suas metas de faturamento para cada ano. O Dashboard calculará as metas mensais automaticamente.
            </p>
          </div>
        </div>
      )}
      
      {/* Action Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="gap-2">
              <Plus size={16} />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Editar Meta Anual' : 'Nova Meta Anual'}
              </DialogTitle>
              <DialogDescription>
                Defina a meta de faturamento para o ano selecionado.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <div className="flex gap-2">
                  {availableYears.map(year => (
                    <Button
                      key={year}
                      type="button"
                      variant={formYear === year ? 'default' : 'outline'}
                      onClick={() => setFormYear(year)}
                      disabled={!editingGoal && existingYears.includes(year)}
                      className="flex-1"
                    >
                      {year}
                      {year === currentYear && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Atual</Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Meta Anual (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="goal"
                    type="text"
                    value={formGoal ? Number(formGoal).toLocaleString('pt-BR') : ''}
                    onChange={(e) => handleGoalInputChange(e.target.value)}
                    placeholder="0"
                    className="pl-10 text-lg font-semibold"
                  />
                </div>
                {formGoal && (
                  <p className="text-xs text-muted-foreground">
                    Meta mensal média: {formatMonthlyGoal(Number(formGoal))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Anotações sobre esta meta..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !formGoal}
                className="gap-2"
              >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Como funciona?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                A meta anual é dividida igualmente entre os 12 meses. O Dashboard irá calcular 
                automaticamente o faturamento realizado a partir das vendas registradas na seção 
                "Lançamentos" e compará-lo com a meta de cada mês.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      {annualGoals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma meta configurada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Adicione sua primeira meta anual para começar a acompanhar seu progresso no Dashboard.
            </p>
            <Button onClick={openNewDialog} className="gap-2">
              <Plus size={16} />
              Criar Meta para {currentYear}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {annualGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={goal.year === currentYear ? 'ring-2 ring-primary/50' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-xl">{goal.year}</CardTitle>
                      {goal.year === currentYear && (
                        <Badge variant="default" className="text-[10px]">Atual</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(goal.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(goal.annual_goal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Meta mensal: {formatMonthlyGoal(goal.annual_goal)}
                      </p>
                    </div>
                    {goal.notes && (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        {goal.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta anual?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A meta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnualGoalsSettings;
