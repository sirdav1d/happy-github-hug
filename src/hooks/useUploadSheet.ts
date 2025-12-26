import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardData, Salesperson, MonthlyData, SalespersonWeekly } from "@/types";
import { Json } from "@/integrations/supabase/types";

interface ProcessedData {
  sheetsFound: string[];
  rowCount: number;
  kpis: DashboardData["kpis"];
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
  team: Salesperson[];
  
}

interface UploadResult {
  success: boolean;
  data?: ProcessedData;
  error?: string;
}

const useUploadSheet = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const { toast } = useToast();

  const parseMonthlySheet = (worksheet: XLSX.WorkSheet): MonthlyData[] => {
    const data: MonthlyData[] = [];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[0] && row[1]) {
        data.push({
          month: String(row[0]),
          year: Number(row[1]) || new Date().getFullYear(),
          revenue: Number(row[2]) || 0,
          goal: Number(row[3]) || 0,
        });
      }
    }
    
    return data;
  };

  const parseTeamSheet = (worksheet: XLSX.WorkSheet): Salesperson[] => {
    const team: Salesperson[] = [];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[0]) {
        team.push({
          id: String(i),
          name: String(row[0]),
          avatar: "",
          totalRevenue: Number(row[1]) || 0,
          monthlyGoal: Number(row[2]) || 0,
          totalSalesCount: Number(row[3]) || 0,
          active: row[4] !== "Não" && row[4] !== "No" && row[4] !== false,
          weeks: [
            { week: 1, revenue: 0, goal: 0 },
            { week: 2, revenue: 0, goal: 0 },
            { week: 3, revenue: 0, goal: 0 },
            { week: 4, revenue: 0, goal: 0 },
          ],
        });
      }
    }
    
    return team;
  };

  const calculateKPIs = (
    historicalData: MonthlyData[],
    currentYearData: MonthlyData[],
    team: Salesperson[]
  ): DashboardData["kpis"] => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString("pt-BR", { month: "long" });
    
    const annualGoal = currentYearData.reduce((sum, m) => sum + m.goal, 0);
    const annualRealized = currentYearData.reduce((sum, m) => sum + m.revenue, 0);
    
    const lastYearData = historicalData.filter(m => m.year === currentYear - 1);
    const lastYearTotal = lastYearData.reduce((sum, m) => sum + m.revenue, 0);
    const lastYearGrowth = lastYearTotal > 0 ? ((annualRealized - lastYearTotal) / lastYearTotal) * 100 : 0;
    
    const totalSalesCount = team.reduce((sum, t) => sum + t.totalSalesCount, 0);
    const activeCustomers = team.filter(t => t.active).length * 50; // Estimativa
    
    return {
      annualGoal,
      annualRealized,
      lastYearGrowth: Math.round(lastYearGrowth * 10) / 10,
      mentorshipGrowth: 0,
      currentMonthName: currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1),
      averageTicket: totalSalesCount > 0 ? Math.round(annualRealized / totalSalesCount) : 0,
      conversionRate: 0,
      cac: 0,
      ltv: 0,
      activeCustomers,
      totalSalesCount,
    };
  };

  const processFile = async (file: File): Promise<UploadResult> => {
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      const sheetsFound = workbook.SheetNames;
      let rowCount = 0;
      
      let historicalData: MonthlyData[] = [];
      let currentYearData: MonthlyData[] = [];
      let team: Salesperson[] = [];
      
      // Try to find and parse relevant sheets
      for (const sheetName of sheetsFound) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        rowCount += jsonData.length - 1; // Subtract header row
        
        const lowerName = sheetName.toLowerCase();
        
        if (lowerName.includes("histórico") || lowerName.includes("historico") || lowerName.includes("historical")) {
          historicalData = parseMonthlySheet(worksheet);
        } else if (lowerName.includes("atual") || lowerName.includes("current") || lowerName.includes("2025") || lowerName.includes("vendas")) {
          currentYearData = parseMonthlySheet(worksheet);
        } else if (lowerName.includes("equipe") || lowerName.includes("team") || lowerName.includes("vendedor")) {
          team = parseTeamSheet(worksheet);
        }
      }
      
      // If we couldn't identify specific sheets, try the first sheet as monthly data
      if (historicalData.length === 0 && currentYearData.length === 0 && sheetsFound.length > 0) {
        const firstSheet = workbook.Sheets[sheetsFound[0]];
        currentYearData = parseMonthlySheet(firstSheet);
      }
      
      const kpis = calculateKPIs(historicalData, currentYearData, team);
      
      const data: ProcessedData = {
        sheetsFound,
        rowCount,
        kpis,
        historicalData,
        currentYearData,
        team,
      };
      
      setProcessedData(data);
      setIsProcessing(false);
      
      return { success: true, data };
    } catch (error) {
      console.error("Error processing file:", error);
      setIsProcessing(false);
      return { 
        success: false, 
        error: "Erro ao processar o arquivo. Verifique se o formato está correto." 
      };
    }
  };

  const saveToDatabase = async (userId: string): Promise<boolean> => {
    if (!processedData) {
      toast({
        title: "Erro",
        description: "Nenhum dado processado para salvar.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Convert data to Json-compatible format
      const kpisJson = processedData.kpis as unknown as Json;
      const historicalDataJson = processedData.historicalData as unknown as Json;
      const currentYearDataJson = processedData.currentYearData as unknown as Json;
      const teamJson = processedData.team as unknown as Json;

      // Check if user already has dashboard data
      const { data: existingData, error: fetchError } = await supabase
        .from("dashboard_data")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("dashboard_data")
          .update({
            kpis: kpisJson,
            historical_data: historicalDataJson,
            current_year_data: currentYearDataJson,
            team: teamJson,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("dashboard_data")
          .insert({
            user_id: userId,
            kpis: kpisJson,
            historical_data: historicalDataJson,
            current_year_data: currentYearDataJson,
            team: teamJson,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso!",
        description: "Dados importados com sucesso.",
      });

      return true;
    } catch (error) {
      console.error("Error saving to database:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados no banco.",
        variant: "destructive",
      });
      return false;
    }
  };

  const reset = () => {
    setProcessedData(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    processedData,
    processFile,
    saveToDatabase,
    reset,
  };
};

export default useUploadSheet;
