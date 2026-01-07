import { useState } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadStatus, LEAD_STATUS_CONFIG } from '@/types/leads';
import { Salesperson } from '@/types';

export interface PipelineFilters {
  search: string;
  status: LeadStatus | 'all';
  salesperson: string;
  source: string;
}

interface PipelineListFiltersProps {
  filters: PipelineFilters;
  onFiltersChange: (filters: PipelineFilters) => void;
  team: Salesperson[];
  leadSources: string[];
}

const PipelineListFilters = ({ 
  filters, 
  onFiltersChange, 
  team, 
  leadSources 
}: PipelineListFiltersProps) => {
  const hasActiveFilters = 
    filters.search !== '' || 
    filters.status !== 'all' || 
    filters.salesperson !== 'all' || 
    filters.source !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      salesperson: 'all',
      source: 'all'
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Busca por nome */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filtro por Status */}
      <Select 
        value={filters.status} 
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as LeadStatus | 'all' })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.entries(LEAD_STATUS_CONFIG).map(([status, config]) => (
            <SelectItem key={status} value={status}>
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config.bgColor}`} />
                {config.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro por Vendedor */}
      <Select 
        value={filters.salesperson} 
        onValueChange={(value) => onFiltersChange({ ...filters, salesperson: value })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Vendedor" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="all">Todos</SelectItem>
          {team.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro por Origem */}
      <Select 
        value={filters.source} 
        onValueChange={(value) => onFiltersChange({ ...filters, source: value })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="all">Todas origens</SelectItem>
          {leadSources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
};

export default PipelineListFilters;
