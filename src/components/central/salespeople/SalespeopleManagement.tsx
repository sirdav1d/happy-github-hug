import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  UserMinus, 
  Calendar, 
  Target,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  History,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useSalespeople, Salesperson } from '@/hooks/useSalespeople';
import { useGoalRules } from '@/hooks/useGoalRules';
import { SalespersonForm } from './SalespersonForm';
import { SalespersonTerminateForm } from './SalespersonTerminateForm';
import { SalespersonTimeline } from './SalespersonTimeline';
import { SalespeopleMigrationBanner } from './SalespeopleMigrationBanner';

export function SalespeopleManagement() {
  const { 
    salespeople, 
    activeSalespeople, 
    inactiveSalespeople,
    isLoading,
    deleteSalesperson,
    reactivateSalesperson,
    getTenure,
  } = useSalespeople();
  const { goalRules, defaultRule, formatRuleDescription } = useGoalRules();

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [terminatingSalesperson, setTerminatingSalesperson] = useState<Salesperson | null>(null);
  const [viewingTimeline, setViewingTimeline] = useState<Salesperson | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filterSalespeople = (list: Salesperson[]) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: Salesperson['status']) => {
    const config = {
      active: { label: 'Ativo', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
      inactive: { label: 'Inativo', variant: 'secondary' as const, className: 'bg-red-500/10 text-red-600 border-red-500/20' },
      on_leave: { label: 'Afastado', variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    };
    const { label, className } = config[status];
    return <Badge className={className}>{label}</Badge>;
  };

  const getGoalRuleInfo = (salesperson: Salesperson) => {
    if (salesperson.goal_override_value) {
      return `Meta fixa: R$ ${salesperson.goal_override_value.toLocaleString('pt-BR')}`;
    }
    if (salesperson.goal_override_percent) {
      return `+${salesperson.goal_override_percent}% personalizado`;
    }
    if (salesperson.goal_rule_id) {
      const rule = goalRules.find(r => r.id === salesperson.goal_rule_id);
      return rule ? rule.name : 'Regra não encontrada';
    }
    return defaultRule ? `${defaultRule.name} (padrão)` : 'Sem regra definida';
  };

  const handleEdit = (salesperson: Salesperson) => {
    setEditingSalesperson(salesperson);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSalesperson(null);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteSalesperson(deletingId);
      setDeletingId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    await reactivateSalesperson(id);
  };

  const renderSalespersonCard = (salesperson: Salesperson) => (
    <motion.div
      key={salesperson.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={salesperson.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(salesperson.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{salesperson.name}</h4>
                {getStatusBadge(salesperson.status)}
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                {salesperson.email && (
                  <p className="truncate">{salesperson.email}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Admissão: {formatDate(salesperson.hire_date)}
                  </span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {getTenure(salesperson)} meses
                  </span>
                </div>
                {salesperson.termination_date && (
                  <p className="text-red-600">
                    Desligado em: {formatDate(salesperson.termination_date)}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs">
                <Target className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">{getGoalRuleInfo(salesperson)}</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(salesperson)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewingTimeline(salesperson)}>
                  <History className="h-4 w-4 mr-2" />
                  Ver histórico
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {salesperson.status === 'active' ? (
                  <DropdownMenuItem 
                    onClick={() => setTerminatingSalesperson(salesperson)}
                    className="text-orange-600"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Registrar desligamento
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => handleReactivate(salesperson.id)}
                    className="text-green-600"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reativar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeletingId(salesperson.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      {/* Migration Banner */}
      <SalespeopleMigrationBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestão de Vendedores
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie sua equipe de vendas, admissões e desligamentos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Vendedor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSalespeople.length}</p>
              <p className="text-sm text-muted-foreground">Vendedores Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <UserMinus className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveSalespeople.length}</p>
              <p className="text-sm text-muted-foreground">Desligados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{goalRules.length}</p>
              <p className="text-sm text-muted-foreground">Regras de Meta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar vendedor por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Users className="h-4 w-4" />
            Ativos ({activeSalespeople.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="gap-2">
            <UserMinus className="h-4 w-4" />
            Inativos ({inactiveSalespeople.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {filterSalespeople(activeSalespeople).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhum vendedor ativo</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece adicionando vendedores à sua equipe
                </p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Vendedor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {filterSalespeople(activeSalespeople).map(renderSalespersonCard)}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {filterSalespeople(inactiveSalespeople).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserMinus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhum vendedor inativo</h3>
                <p className="text-muted-foreground text-center">
                  Vendedores desligados aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {filterSalespeople(inactiveSalespeople).map(renderSalespersonCard)}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <SalespersonForm
        open={showForm}
        onOpenChange={handleCloseForm}
        salesperson={editingSalesperson}
      />

      {/* Terminate Modal */}
      <SalespersonTerminateForm
        open={!!terminatingSalesperson}
        onOpenChange={() => setTerminatingSalesperson(null)}
        salesperson={terminatingSalesperson}
      />

      {/* Timeline Modal */}
      <SalespersonTimeline
        open={!!viewingTimeline}
        onOpenChange={() => setViewingTimeline(null)}
        salesperson={viewingTimeline}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vendedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados e histórico do vendedor serão removidos permanentemente.
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
