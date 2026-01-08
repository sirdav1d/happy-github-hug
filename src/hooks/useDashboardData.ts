import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardData, MonthlyData, Salesperson, KPI, YearlyRevenue } from "@/types";
import { Json } from "@/integrations/supabase/types";

interface UseDashboardDataReturn {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  saveData: (data: Partial<DashboardData>, replaceAll?: boolean) => Promise<boolean>;
  deleteAllData: () => Promise<boolean>;
  mergeData: (newData: Partial<DashboardData>) => Promise<boolean>;
}

const defaultKPIs: KPI = {
  annualGoal: 0,
  annualRealized: 0,
  lastYearGrowth: 0,
  mentorshipGrowth: 0,
  currentMonthName: "",
  averageTicket: 0,
  conversionRate: 0,
  cac: 0,
  ltv: 0,
  activeCustomers: 0,
  totalSalesCount: 0,
};

export const useDashboardData = (userId: string | undefined): UseDashboardDataReturn => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar dados do dashboard, vendas e leads em paralelo
      const [dashboardResult, salesResult, leadsResult] = await Promise.all([
        supabase
          .from("dashboard_data")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("sales")
          .select("amount, is_new_client, acquisition_cost")
          .eq("user_id", userId),
        supabase
          .from("leads")
          .select("id, status, converted_sale_id")
          .eq("user_id", userId)
      ]);

      if (dashboardResult.error) {
        throw dashboardResult.error;
      }

      const data = dashboardResult.data;
      const salesData = salesResult.data || [];
      const leadsData = leadsResult.data || [];

      if (data) {
        // Calcular KPIs dinâmicos a partir das vendas
        const totalSales = salesData.length;
        const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const newClients = salesData.filter(s => s.is_new_client).length;
        const totalAcquisitionCost = salesData.reduce((sum, s) => sum + Number(s.acquisition_cost || 0), 0);
        const cac = newClients > 0 ? totalAcquisitionCost / newClients : 0;
        
        // LTV estimado: ticket médio × frequência estimada de 4 compras
        const ltv = averageTicket * 4;

        // Taxa de conversão baseada em leads do pipeline
        const totalLeads = leadsData.length;
        const convertedLeads = leadsData.filter(
          l => l.status === 'fechamento' || l.converted_sale_id !== null
        ).length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        const storedKpis = (data.kpis as unknown as KPI) || defaultKPIs;
        
        // Mesclar KPIs calculados com os armazenados
        const dynamicKpis: KPI = {
          ...storedKpis,
          averageTicket: averageTicket > 0 ? averageTicket : storedKpis.averageTicket,
          totalSalesCount: totalSales > 0 ? totalSales : storedKpis.totalSalesCount,
          cac: cac > 0 ? cac : storedKpis.cac,
          ltv: ltv > 0 ? ltv : storedKpis.ltv,
          conversionRate: conversionRate > 0 ? conversionRate : storedKpis.conversionRate,
        };

        const parsedData: DashboardData = {
          companyName: data.company_name || "Minha Empresa",
          businessSegment: data.business_segment || "Varejo",
          customLogoUrl: data.custom_logo_url || undefined,
          appSettings: (data.app_settings as unknown as DashboardData["appSettings"]) || { aggressiveMode: false, considerVacation: false },
          kpis: dynamicKpis,
          historicalData: (data.historical_data as unknown as MonthlyData[]) || [],
          currentYearData: (data.current_year_data as unknown as MonthlyData[]) || [],
          team: (data.team as unknown as Salesperson[]) || [],
          mentorshipStartDate: data.mentorship_start_date || undefined,
          selectedMonth: data.selected_month || undefined,
          lastUploadDate: data.last_upload_date || undefined,
          yearsAvailable: data.years_available || [],
        };
        setDashboardData(parsedData);
      } else {
        setDashboardData(null);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveData = async (data: Partial<DashboardData>, replaceAll = false): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Preparar dados para salvar
      const updateData: Record<string, Json | string | number[] | null> = {
        updated_at: new Date().toISOString(),
        last_upload_date: new Date().toISOString(),
      };

      if (data.kpis) updateData.kpis = data.kpis as unknown as Json;
      if (data.historicalData !== undefined) updateData.historical_data = data.historicalData as unknown as Json;
      if (data.currentYearData !== undefined) updateData.current_year_data = data.currentYearData as unknown as Json;
      if (data.team !== undefined) updateData.team = data.team as unknown as Json;
      if (data.companyName !== undefined) updateData.company_name = data.companyName;
      if (data.businessSegment !== undefined) updateData.business_segment = data.businessSegment;
      if (data.selectedMonth) updateData.selected_month = data.selectedMonth;
      if (data.yearsAvailable) updateData.years_available = data.yearsAvailable;
      if (data.mentorshipStartDate !== undefined) updateData.mentorship_start_date = data.mentorshipStartDate || null;
      if (data.appSettings !== undefined) updateData.app_settings = data.appSettings as unknown as Json;

      // Verificar se já existe registro
      const { data: existingData, error: checkError } = await supabase
        .from("dashboard_data")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingData) {
        // Update existente
        const { error: updateError } = await supabase
          .from("dashboard_data")
          .update(updateData)
          .eq("id", existingData.id);

        if (updateError) throw updateError;
      } else {
        // Insert novo
        const { error: insertError } = await supabase
          .from("dashboard_data")
          .insert({
            user_id: userId,
            ...updateData,
          });

        if (insertError) throw insertError;
      }

      // Atualizar estado local
      await fetchData();

      toast({
        title: "Sucesso!",
        description: "Dados salvos com sucesso.",
      });

      return true;
    } catch (err) {
      console.error("Error saving dashboard data:", err);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados.",
        variant: "destructive",
      });
      return false;
    }
  };

  const mergeData = async (newData: Partial<DashboardData>): Promise<boolean> => {
    if (!dashboardData) {
      // Se não existem dados anteriores, apenas salvar os novos
      return saveData(newData, false);
    }

    // Mesclar dados históricos (evitar duplicatas por mês/ano)
    let mergedHistorical = [...dashboardData.historicalData];
    let mergedCurrent = [...dashboardData.currentYearData];
    let mergedTeam = [...dashboardData.team];

    if (newData.historicalData) {
      for (const newMonth of newData.historicalData) {
        const existingIndex = mergedHistorical.findIndex(
          (m) => m.month === newMonth.month && m.year === newMonth.year
        );
        if (existingIndex >= 0) {
          mergedHistorical[existingIndex] = newMonth; // Atualizar
        } else {
          mergedHistorical.push(newMonth); // Adicionar
        }
      }
    }

    if (newData.currentYearData) {
      for (const newMonth of newData.currentYearData) {
        const existingIndex = mergedCurrent.findIndex(
          (m) => m.month === newMonth.month && m.year === newMonth.year
        );
        if (existingIndex >= 0) {
          mergedCurrent[existingIndex] = newMonth;
        } else {
          mergedCurrent.push(newMonth);
        }
      }
    }

    if (newData.team) {
      // Para equipe, substituir por nome ou adicionar
      for (const newMember of newData.team) {
        const existingIndex = mergedTeam.findIndex(
          (t) => t.name.toLowerCase() === newMember.name.toLowerCase()
        );
        if (existingIndex >= 0) {
          mergedTeam[existingIndex] = newMember;
        } else {
          mergedTeam.push(newMember);
        }
      }
    }

    // Mesclar anos disponíveis
    const mergedYears = Array.from(
      new Set([...(dashboardData.yearsAvailable || []), ...(newData.yearsAvailable || [])])
    ).sort();

    return saveData({
      ...newData,
      historicalData: mergedHistorical,
      currentYearData: mergedCurrent,
      team: mergedTeam,
      yearsAvailable: mergedYears,
    });
  };

  const deleteAllData = async (): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from("dashboard_data")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      setDashboardData(null);

      toast({
        title: "Sucesso",
        description: "Todos os dados foram deletados.",
      });

      return true;
    } catch (err) {
      console.error("Error deleting dashboard data:", err);
      toast({
        title: "Erro",
        description: "Não foi possível deletar os dados.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    dashboardData,
    isLoading,
    error,
    fetchData,
    saveData,
    deleteAllData,
    mergeData,
  };
};

export default useDashboardData;
