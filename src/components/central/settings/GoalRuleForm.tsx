import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, TrendingUp, Calendar, Users, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoalRules, GoalRule, CreateGoalRuleInput, UpdateGoalRuleInput } from '@/hooks/useGoalRules';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  rule_type: z.enum(['percentage', 'fixed', 'manual']),
  base_reference: z.enum(['previous_year_same_month', 'previous_month', 'team_average', 'manual']),
  percentage_value: z.number().min(0).max(200),
  fixed_value: z.number().optional().nullable(),
  is_default: z.boolean().default(false),
  new_hire_strategy: z.enum(['team_average', 'fixed_rampup', 'manual', 'no_goal']),
  rampup_months: z.number().min(1).max(12).optional().nullable(),
  rampup_start_percent: z.number().min(0).max(100).optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface GoalRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: GoalRule | null;
}

export function GoalRuleForm({ open, onOpenChange, rule }: GoalRuleFormProps) {
  const { createGoalRule, updateGoalRule, isCreating, isUpdating } = useGoalRules();

  const isEditing = !!rule;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      rule_type: rule?.rule_type || 'percentage',
      base_reference: rule?.base_reference || 'previous_year_same_month',
      percentage_value: rule?.percentage_value || 15,
      fixed_value: rule?.fixed_value || null,
      is_default: rule?.is_default || false,
      new_hire_strategy: rule?.new_hire_strategy || 'team_average',
      rampup_months: rule?.rampup_months || 3,
      rampup_start_percent: rule?.rampup_start_percent || 50,
    },
  });

  const ruleType = form.watch('rule_type');
  const newHireStrategy = form.watch('new_hire_strategy');

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateGoalRule({
          id: rule.id,
          ...data,
        });
      } else {
        await createGoalRule({
          name: data.name,
          description: data.description,
          rule_type: data.rule_type,
          base_reference: data.base_reference,
          percentage_value: data.percentage_value,
          fixed_value: data.fixed_value ?? undefined,
          is_default: data.is_default,
          new_hire_strategy: data.new_hire_strategy,
          rampup_months: data.rampup_months ?? undefined,
          rampup_start_percent: data.rampup_start_percent ?? undefined,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving goal rule:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {isEditing ? 'Editar Regra de Meta' : 'Nova Regra de Meta'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as configurações da regra'
              : 'Configure como as metas serão calculadas'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Regra *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Padrão +15%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva quando usar esta regra..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Regra Padrão</FormLabel>
                      <FormDescription>
                        Aplicada a vendedores sem regra específica
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Goal Calculation */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Cálculo da Meta</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rule_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Regra</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual (+%)</SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="base_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base de Referência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="previous_year_same_month">Mesmo mês ano anterior</SelectItem>
                          <SelectItem value="previous_month">Mês anterior</SelectItem>
                          <SelectItem value="team_average">Média da equipe</SelectItem>
                          <SelectItem value="manual">Definição manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {ruleType === 'percentage' && (
                <FormField
                  control={form.control}
                  name="percentage_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual de Crescimento (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Meta = Base de referência + {field.value || 0}%
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {ruleType === 'fixed' && (
                <FormField
                  control={form.control}
                  name="fixed_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Fixo Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* New Hire Strategy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Estratégia para Vendedores Novos</h4>
              </div>

              <FormField
                control={form.control}
                name="new_hire_strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Como calcular meta de novos vendedores?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="team_average">Usar média da equipe</SelectItem>
                        <SelectItem value="fixed_rampup">Ramp-up progressivo</SelectItem>
                        <SelectItem value="manual">Definir manualmente</SelectItem>
                        <SelectItem value="no_goal">Sem meta inicial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Para vendedores sem histórico do ano anterior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {newHireStrategy === 'fixed_rampup' && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <FormField
                    control={form.control}
                    name="rampup_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meses de Ramp-up</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={12}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rampup_start_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% Inicial</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Começa em {field.value || 50}% da meta
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Exemplo de Cálculo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {ruleType === 'percentage' && (
                  <>
                    Se o vendedor faturou R$ 50.000 no mesmo mês do ano passado, 
                    a meta será R$ {(50000 * (1 + (form.watch('percentage_value') || 15) / 100)).toLocaleString('pt-BR')}.
                  </>
                )}
                {ruleType === 'fixed' && (
                  <>
                    Meta fixa de R$ {(form.watch('fixed_value') || 0).toLocaleString('pt-BR')} por mês.
                  </>
                )}
                {ruleType === 'manual' && (
                  <>
                    A meta será definida manualmente para cada vendedor/período.
                  </>
                )}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Regra'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
