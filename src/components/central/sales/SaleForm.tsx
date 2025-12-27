import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, User, DollarSign, Tag, MapPin, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { SaleFormData, LEAD_SOURCE_OPTIONS, CHANNEL_OPTIONS, Client } from '@/types/sales';
import { Salesperson } from '@/types';

const saleSchema = z.object({
  sale_date: z.string().min(1, 'Data é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  salesperson_id: z.string().min(1, 'Vendedor é obrigatório'),
  salesperson_name: z.string().min(1, 'Vendedor é obrigatório'),
  channel: z.enum(['online', 'presencial']),
  client_id: z.string().optional(),
  client_name: z.string().optional(),
  is_new_client: z.boolean(),
  acquisition_cost: z.number().min(0),
  lead_source: z.enum(['indicacao', 'redes_sociais', 'google', 'evento', 'cold_call', 'parceiro', 'outro']).optional(),
  product_service: z.string().optional(),
  notes: z.string().optional(),
});

interface SaleFormProps {
  team: Salesperson[];
  clients: Client[];
  onSubmit: (data: SaleFormData) => Promise<void>;
  onCreateClient: (name: string) => Promise<Client | null>;
  isSubmitting: boolean;
}

const SaleForm: React.FC<SaleFormProps> = ({
  team,
  clients,
  onSubmit,
  onCreateClient,
  isSubmitting,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPopover, setShowClientPopover] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      sale_date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      salesperson_id: '',
      salesperson_name: '',
      channel: 'presencial',
      is_new_client: false,
      acquisition_cost: 0,
    },
  });

  const watchIsNewClient = watch('is_new_client');
  const watchClientId = watch('client_id');

  useEffect(() => {
    setValue('sale_date', format(date, 'yyyy-MM-dd'));
  }, [date, setValue]);

  const handleSalespersonChange = (salespersonId: string) => {
    const salesperson = team.find(s => s.id === salespersonId);
    if (salesperson) {
      setValue('salesperson_id', salesperson.id);
      setValue('salesperson_name', salesperson.name);
    }
  };

  const handleClientSelect = (client: Client) => {
    setValue('client_id', client.id);
    setValue('client_name', client.name);
    setClientSearch(client.name);
    setShowClientPopover(false);
  };

  const handleCreateNewClient = async () => {
    if (!clientSearch.trim()) return;
    
    setIsCreatingClient(true);
    const newClient = await onCreateClient(clientSearch.trim());
    setIsCreatingClient(false);
    
    if (newClient) {
      handleClientSelect(newClient);
      setValue('is_new_client', true);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const onFormSubmit = async (data: SaleFormData) => {
    await onSubmit(data);
    reset();
    setDate(new Date());
    setClientSearch('');
  };

  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Data da Venda */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <CalendarIcon size={16} className="text-primary" />
            Data da Venda *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione a data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {errors.sale_date && (
            <p className="text-xs text-destructive">{errors.sale_date.message}</p>
          )}
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <DollarSign size={16} className="text-emerald-500" />
            Valor da Venda *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              className="pl-10"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* Vendedor */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <User size={16} className="text-blue-500" />
            Vendedor *
          </Label>
          <Select onValueChange={handleSalespersonChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o vendedor" />
            </SelectTrigger>
            <SelectContent>
              {activeTeam.length > 0 ? (
                activeTeam.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_empty" disabled>
                  Nenhum vendedor cadastrado
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.salesperson_id && (
            <p className="text-xs text-destructive">{errors.salesperson_id.message}</p>
          )}
        </div>

        {/* Canal */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <MapPin size={16} className="text-violet-500" />
            Canal *
          </Label>
          <Select defaultValue="presencial" onValueChange={(v) => setValue('channel', v as 'online' | 'presencial')}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o canal" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <UserPlus size={16} className="text-amber-500" />
            Cliente
          </Label>
          <Popover open={showClientPopover} onOpenChange={setShowClientPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                {clientSearch || 'Buscar ou criar cliente...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Digite o nome do cliente..."
                  value={clientSearch}
                  onValueChange={setClientSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-2 space-y-2">
                      <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                      {clientSearch && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={handleCreateNewClient}
                          disabled={isCreatingClient}
                        >
                          <Plus size={14} className="mr-1" />
                          {isCreatingClient ? 'Criando...' : `Criar "${clientSearch}"`}
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredClients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.name}
                        onSelect={() => handleClientSelect(client)}
                      >
                        {client.name}
                        {client.email && (
                          <span className="ml-2 text-xs text-muted-foreground">{client.email}</span>
                        )}
                      </CommandItem>
                    ))}
                    {clientSearch && !filteredClients.find(c => c.name.toLowerCase() === clientSearch.toLowerCase()) && (
                      <CommandItem onSelect={handleCreateNewClient}>
                        <Plus size={14} className="mr-2" />
                        Criar novo: "{clientSearch}"
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* É Cliente Novo? */}
        <div className="space-y-2">
          <Label className="text-foreground">É cliente novo?</Label>
          <div className="flex items-center gap-3 h-10">
            <Switch
              checked={watchIsNewClient}
              onCheckedChange={(checked) => setValue('is_new_client', checked)}
            />
            <span className={cn(
              "text-sm",
              watchIsNewClient ? "text-emerald-500 font-medium" : "text-muted-foreground"
            )}>
              {watchIsNewClient ? 'Sim, primeira compra!' : 'Não, cliente recorrente'}
            </span>
          </div>
        </div>

        {/* Custo de Aquisição (mostrar se cliente novo) */}
        {watchIsNewClient && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <DollarSign size={16} className="text-orange-500" />
              Custo de Aquisição (CAC)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="pl-10"
                {...register('acquisition_cost', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}

        {/* Origem do Lead */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Tag size={16} className="text-pink-500" />
            Origem do Lead
          </Label>
          <Select onValueChange={(v) => setValue('lead_source', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Como o cliente chegou?" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Produto/Serviço */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <FileText size={16} className="text-cyan-500" />
            Produto/Serviço
          </Label>
          <Input
            placeholder="Ex: Consultoria, Produto X..."
            {...register('product_service')}
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label className="text-foreground">Observações</Label>
        <Textarea
          placeholder="Anotações adicionais sobre a venda..."
          className="resize-none"
          rows={2}
          {...register('notes')}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25"
      >
        {isSubmitting ? (
          <>
            <span className="animate-pulse">Registrando...</span>
          </>
        ) : (
          <>
            <Plus size={18} className="mr-2" />
            Registrar Venda
          </>
        )}
      </Button>
    </form>
  );
};

export default SaleForm;
