import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Target, User, Info } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useSalespeople, Salesperson, CreateSalespersonInput, UpdateSalespersonInput } from '@/hooks/useSalespeople';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  hire_date: z.date({ required_error: 'Data de admissão é obrigatória' }),
  channel_preference: z.string().optional(),
  use_custom_goal: z.boolean().default(false),
  goal_override_percent: z.number().optional().nullable(),
  goal_override_value: z.number().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface SalespersonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesperson?: Salesperson | null;
}

export function SalespersonForm({ open, onOpenChange, salesperson }: SalespersonFormProps) {
  const { createSalesperson, updateSalesperson, isCreating, isUpdating } = useSalespeople();

  const isEditing = !!salesperson;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: salesperson?.name || '',
      email: salesperson?.email || '',
      phone: salesperson?.phone || '',
      hire_date: salesperson?.hire_date ? new Date(salesperson.hire_date) : new Date(),
      channel_preference: salesperson?.channel_preference || 'presencial',
      use_custom_goal: !!(salesperson?.goal_override_percent || salesperson?.goal_override_value),
      goal_override_percent: salesperson?.goal_override_percent || null,
      goal_override_value: salesperson?.goal_override_value || null,
    },
  });

  const useCustomGoal = form.watch('use_custom_goal');

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        const updateData: UpdateSalespersonInput = {
          id: salesperson.id,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          hire_date: format(data.hire_date, 'yyyy-MM-dd'),
          channel_preference: data.channel_preference,
          goal_override_percent: data.use_custom_goal ? data.goal_override_percent : null,
          goal_override_value: data.use_custom_goal ? data.goal_override_value : null,
        };
        await updateSalesperson(updateData);
      } else {
        const createData: CreateSalespersonInput = {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          hire_date: format(data.hire_date, 'yyyy-MM-dd'),
          channel_preference: data.channel_preference,
          goal_override_percent: data.use_custom_goal ? data.goal_override_percent || undefined : undefined,
          goal_override_value: data.use_custom_goal ? data.goal_override_value || undefined : undefined,
        };
        await createSalesperson(createData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving salesperson:', error);
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
            <User className="h-5 w-5 text-primary" />
            {isEditing ? 'Editar Vendedor' : 'Novo Vendedor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do vendedor'
              : 'Preencha os dados para cadastrar um novo vendedor'}
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
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hire_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Admissão *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                              ) : (
                                <span>Selecione</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channel_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canal Preferencial</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Goal Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Configuração de Meta</h4>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Por padrão, a meta é calculada dividindo a meta anual igualmente entre os vendedores ativos. 
                  Novos colaboradores têm ramp-up automático (50% → 75% → 100% nos 3 primeiros meses).
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="use_custom_goal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Meta Personalizada</FormLabel>
                      <FormDescription>
                        Definir um percentual ou valor fixo diferente do padrão
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

              {useCustomGoal && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="goal_override_percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% Personalizado</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 120"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Aplica este % sobre a meta base individual
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goal_override_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Fixo (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 50000"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Meta mensal fixa (ignora distribuição)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
