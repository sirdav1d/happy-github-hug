import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadFormData, LeadStatus, STATUS_DATE_FIELD, ACTIVE_PIPELINE_STAGES, LEAD_STATUS_CONFIG } from '@/types/leads';
import { toast } from 'sonner';

interface FunnelMetrics {
  status: LeadStatus;
  count: number;
  value: number;
  conversionRate: number;
}

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setLeads((data || []) as Lead[]);
    } catch (err: any) {
      console.error('Erro ao buscar leads:', err);
      setError(err.message);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = useCallback(async (data: LeadFormData): Promise<Lead | null> => {
    if (!user?.id) return null;

    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          client_name: data.client_name,
          email: data.email || null,
          phone: data.phone || null,
          status: data.status || 'prospeccao',
          salesperson_id: data.salesperson_id || null,
          salesperson_name: data.salesperson_name || null,
          estimated_value: data.estimated_value || null,
          lead_source: data.lead_source || null,
          next_contact_date: data.next_contact_date || null,
          next_contact_notes: data.next_contact_notes || null,
          comments: data.comments || null,
          prospecting_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => [newLead as Lead, ...prev]);
      toast.success('Lead criado com sucesso!');
      return newLead as Lead;
    } catch (err: any) {
      console.error('Erro ao criar lead:', err);
      toast.error('Erro ao criar lead');
      return null;
    }
  }, [user?.id]);

  const updateLead = useCallback(async (id: string, data: Partial<LeadFormData>): Promise<Lead | null> => {
    if (!user?.id) return null;

    try {
      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === id ? updatedLead as Lead : l));
      toast.success('Lead atualizado!');
      return updatedLead as Lead;
    } catch (err: any) {
      console.error('Erro ao atualizar lead:', err);
      toast.error('Erro ao atualizar lead');
      return null;
    }
  }, [user?.id]);

  const moveToStage = useCallback(async (id: string, newStatus: LeadStatus): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const dateField = STATUS_DATE_FIELD[newStatus];
      const updateData: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Atualizar data do estágio
      if (dateField) {
        updateData[dateField] = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setLeads(prev => prev.map(l => 
        l.id === id 
          ? { ...l, status: newStatus, [dateField]: new Date().toISOString() } 
          : l
      ));
      
      toast.success(`Lead movido para ${LEAD_STATUS_CONFIG[newStatus].label}`);
      return true;
    } catch (err: any) {
      console.error('Erro ao mover lead:', err);
      toast.error('Erro ao mover lead');
      return false;
    }
  }, [user?.id]);

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Lead removido');
      return true;
    } catch (err: any) {
      console.error('Erro ao deletar lead:', err);
      toast.error('Erro ao remover lead');
      return false;
    }
  }, [user?.id]);

  // Leads agrupados por status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      prospeccao: [],
      abordagem: [],
      apresentacao: [],
      followup: [],
      negociacao: [],
      fechado_ganho: [],
      fechado_perdido: [],
      pos_vendas: []
    };

    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  // Contatos para hoje
  const todayContacts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(l => 
      l.next_contact_date === today && 
      !['fechado_ganho', 'fechado_perdido'].includes(l.status)
    );
  }, [leads]);

  // Contatos atrasados
  const overdueContacts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(l => 
      l.next_contact_date && 
      l.next_contact_date < today && 
      !['fechado_ganho', 'fechado_perdido'].includes(l.status)
    );
  }, [leads]);

  // Métricas do funil - 7 etapas completas
  const funnelMetrics = useMemo((): FunnelMetrics[] => {
    const stages: LeadStatus[] = [
      'prospeccao',
      'abordagem',
      'apresentacao',
      'followup',
      'negociacao',
      'fechado_ganho',
      'pos_vendas'
    ];
    
    return stages.map((status, index) => {
      const stageLeads = leadsByStatus[status] || [];
      const count = stageLeads.length;
      const value = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      
      // Taxa de conversão: leads neste estágio / leads no estágio anterior
      let conversionRate = 100;
      if (index > 0) {
        const prevStatus = stages[index - 1];
        const prevCount = (leadsByStatus[prevStatus] || []).length;
        conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;
      }

      return { status, count, value, conversionRate };
    });
  }, [leadsByStatus]);

  // Valor total em pipeline (apenas etapas ativas)
  const totalPipelineValue = useMemo(() => {
    return ACTIVE_PIPELINE_STAGES.reduce((sum, status) => {
      const stageLeads = leadsByStatus[status] || [];
      return sum + stageLeads.reduce((s, l) => s + (l.estimated_value || 0), 0);
    }, 0);
  }, [leadsByStatus]);

  // Total de leads ativos
  const totalActiveLeads = useMemo(() => {
    return ACTIVE_PIPELINE_STAGES.reduce((sum, status) => {
      return sum + (leadsByStatus[status] || []).length;
    }, 0);
  }, [leadsByStatus]);

  // Leads perdidos (últimos 30 dias)
  const lostLeadsCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return (leadsByStatus['fechado_perdido'] || []).filter(l => {
      if (!l.closing_date) return false;
      return new Date(l.closing_date) >= thirtyDaysAgo;
    }).length;
  }, [leadsByStatus]);

  // Taxa de perda (perdidos / (ganhos + perdidos))
  const lossRate = useMemo(() => {
    const wonCount = (leadsByStatus['fechado_ganho'] || []).length;
    const lostCount = (leadsByStatus['fechado_perdido'] || []).length;
    const total = wonCount + lostCount;
    return total > 0 ? (lostCount / total) * 100 : 0;
  }, [leadsByStatus]);

  return {
    leads,
    isLoading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    moveToStage,
    deleteLead,
    leadsByStatus,
    todayContacts,
    overdueContacts,
    funnelMetrics,
    totalPipelineValue,
    totalActiveLeads,
    lostLeadsCount,
    lossRate
  };
}
