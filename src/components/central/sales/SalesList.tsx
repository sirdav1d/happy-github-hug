import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit2, User, MapPin, Calendar, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sale, LEAD_SOURCE_OPTIONS } from '@/types/sales';
import { cn } from '@/lib/utils';

interface SalesListProps {
  sales: Sale[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<boolean>;
}

const SalesList: React.FC<SalesListProps> = ({ sales, isLoading, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const getLeadSourceLabel = (source: string | null | undefined) => {
    if (!source) return null;
    return LEAD_SOURCE_OPTIONS.find(o => o.value === source)?.label || source;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">Nenhuma venda registrada</p>
        <p className="text-sm">Comece registrando sua primeira venda acima!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => (
        <Card
          key={sale.id}
          className={cn(
            "p-4 border border-border/50 bg-card/50 hover:bg-card transition-colors",
            deletingId === sale.id && "opacity-50"
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold text-emerald-500">
                  {formatCurrency(sale.amount)}
                </span>
                <Badge
                  variant={sale.channel === 'online' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  <MapPin size={12} className="mr-1" />
                  {sale.channel === 'online' ? 'Online' : 'Presencial'}
                </Badge>
                {sale.is_new_client && (
                  <Badge variant="default" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                    Novo cliente
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <User size={14} className="text-blue-500" />
                  {sale.salesperson_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-violet-500" />
                  {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                {sale.client_name && (
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground/60">Cliente:</span>
                    {sale.client_name}
                  </span>
                )}
                {sale.lead_source && (
                  <span className="flex items-center gap-1">
                    <Tag size={14} className="text-pink-500" />
                    {getLeadSourceLabel(sale.lead_source)}
                  </span>
                )}
              </div>
              
              {sale.product_service && (
                <p className="text-xs text-muted-foreground/60">
                  {sale.product_service}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deletingId === sale.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover venda?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A venda de {formatCurrency(sale.amount)} 
                      {' '}realizada por {sale.salesperson_name} será removida permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(sale.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SalesList;
