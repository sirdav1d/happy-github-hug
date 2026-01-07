import { useState, useMemo } from 'react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Eye, 
  Edit2, 
  ArrowRight, 
  Trash2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lead, LeadStatus, LEAD_STATUS_CONFIG, ALL_PIPELINE_STAGES } from '@/types/leads';
import { Salesperson } from '@/types';
import PipelineListFilters, { PipelineFilters } from './PipelineListFilters';

interface PipelineListProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onMoveStage: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
  team: Salesperson[];
}

type SortField = 'client_name' | 'status' | 'estimated_value' | 'salesperson_name' | 'next_contact_date' | 'created_at';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const PipelineList = ({ leads, onLeadClick, onMoveStage, onDelete, team }: PipelineListProps) => {
  const [filters, setFilters] = useState<PipelineFilters>({
    search: '',
    status: 'all',
    salesperson: 'all',
    source: 'all'
  });
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Extrair origens únicas dos leads
  const leadSources = useMemo(() => {
    const sources = new Set<string>();
    leads.forEach(lead => {
      if (lead.lead_source) sources.add(lead.lead_source);
    });
    return Array.from(sources);
  }, [leads]);

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Filtro por busca
      if (filters.search && !lead.client_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      // Filtro por status
      if (filters.status !== 'all' && lead.status !== filters.status) {
        return false;
      }
      // Filtro por vendedor
      if (filters.salesperson !== 'all' && lead.salesperson_id !== filters.salesperson) {
        return false;
      }
      // Filtro por origem
      if (filters.source !== 'all' && lead.lead_source !== filters.source) {
        return false;
      }
      return true;
    });
  }, [leads, filters]);

  // Ordenar leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'client_name':
          comparison = a.client_name.localeCompare(b.client_name);
          break;
        case 'status':
          comparison = LEAD_STATUS_CONFIG[a.status as LeadStatus].order - LEAD_STATUS_CONFIG[b.status as LeadStatus].order;
          break;
        case 'estimated_value':
          comparison = (a.estimated_value || 0) - (b.estimated_value || 0);
          break;
        case 'salesperson_name':
          comparison = (a.salesperson_name || '').localeCompare(b.salesperson_name || '');
          break;
        case 'next_contact_date':
          if (!a.next_contact_date && !b.next_contact_date) comparison = 0;
          else if (!a.next_contact_date) comparison = 1;
          else if (!b.next_contact_date) comparison = -1;
          else comparison = new Date(a.next_contact_date).getTime() - new Date(b.next_contact_date).getTime();
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedLeads, currentPage]);

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatContactDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return { text: '-', isOverdue: false, isToday: false };
    
    const date = parseISO(dateStr);
    const today = isToday(date);
    const overdue = isPast(date) && !today;
    
    return {
      text: format(date, "dd/MM", { locale: ptBR }),
      isOverdue: overdue,
      isToday: today
    };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <PipelineListFilters 
        filters={filters}
        onFiltersChange={setFilters}
        team={team}
        leadSources={leadSources}
      />

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('client_name')}
              >
                <div className="flex items-center">
                  Cliente
                  <SortIcon field="client_name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('estimated_value')}
              >
                <div className="flex items-center">
                  Valor
                  <SortIcon field="estimated_value" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('salesperson_name')}
              >
                <div className="flex items-center">
                  Vendedor
                  <SortIcon field="salesperson_name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('next_contact_date')}
              >
                <div className="flex items-center">
                  Próx. Contato
                  <SortIcon field="next_contact_date" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Criado em
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {leads.length === 0 
                    ? 'Nenhum lead cadastrado ainda'
                    : 'Nenhum lead encontrado com os filtros aplicados'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => {
                const statusConfig = LEAD_STATUS_CONFIG[lead.status as LeadStatus];
                const contactDate = formatContactDate(lead.next_contact_date);

                return (
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => onLeadClick(lead)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.client_name}</p>
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`${statusConfig.bgColor} text-white border-0`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(lead.estimated_value)}
                    </TableCell>
                    <TableCell>
                      {lead.salesperson_name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {contactDate.isOverdue && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {contactDate.isToday && (
                          <Calendar className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={
                          contactDate.isOverdue 
                            ? 'text-destructive font-medium' 
                            : contactDate.isToday 
                              ? 'text-amber-500 font-medium' 
                              : ''
                        }>
                          {contactDate.text}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(lead.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                          <DropdownMenuItem onClick={() => onLeadClick(lead)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Mover para
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-popover border-border z-50">
                              {ALL_PIPELINE_STAGES.map((status) => {
                                const config = LEAD_STATUS_CONFIG[status];
                                if (status === lead.status) return null;
                                return (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => onMoveStage(lead.id, status)}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`} />
                                    {config.label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(lead.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedLeads.length)} de {sortedLeads.length} leads
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineList;
