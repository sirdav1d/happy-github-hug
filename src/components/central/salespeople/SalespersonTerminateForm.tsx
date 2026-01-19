import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, UserMinus, AlertTriangle } from 'lucide-react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useSalespeople, Salesperson, TerminationReason } from '@/hooks/useSalespeople';

const formSchema = z.object({
  termination_date: z.date({ required_error: 'Data de desligamento é obrigatória' }),
  termination_reason: z.enum(['dismissal', 'resignation', 'retirement', 'contract_end', 'other'], {
    required_error: 'Motivo é obrigatório',
  }),
  termination_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SalespersonTerminateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesperson?: Salesperson | null;
}

const reasonLabels: Record<TerminationReason, string> = {
  dismissal: 'Demissão',
  resignation: 'Pedido de demissão',
  retirement: 'Aposentadoria',
  contract_end: 'Fim de contrato',
  other: 'Outro',
};

export function SalespersonTerminateForm({ open, onOpenChange, salesperson }: SalespersonTerminateFormProps) {
  const { terminateSalesperson, isTerminating } = useSalespeople();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      termination_date: new Date(),
      termination_reason: undefined,
      termination_notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!salesperson) return;

    try {
      await terminateSalesperson({
        id: salesperson.id,
        termination_date: format(data.termination_date, 'yyyy-MM-dd'),
        termination_reason: data.termination_reason as TerminationReason,
        termination_notes: data.termination_notes,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error terminating salesperson:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!salesperson) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <UserMinus className="h-5 w-5" />
            Registrar Desligamento
          </DialogTitle>
          <DialogDescription>
            Registrar o desligamento de <strong>{salesperson.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-600">
            O histórico do vendedor será preservado para análises e relatórios.
            Você poderá reativar o vendedor posteriormente se necessário.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="termination_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Desligamento *</FormLabel>
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
                        disabled={(date) => date > new Date() || date < new Date(salesperson.hire_date)}
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
              name="termination_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termination_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o desligamento..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isTerminating}
                variant="destructive"
              >
                {isTerminating ? 'Processando...' : 'Confirmar Desligamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
