import { useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { DashboardData, Salesperson, MonthlyData, SalespersonWeekly, UploadConfig } from "@/types";

interface ProcessedData {
  sheetsFound: string[];
  rowCount: number;
  kpis: DashboardData["kpis"];
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
  team: Salesperson[];
  yearsAvailable: number[];
  selectedMonth: string;
  mentorshipStartDate?: string;
}

interface UploadResult {
  success: boolean;
  data?: ProcessedData;
  error?: string;
}

// Mapeamento de meses em português
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const monthNamesLong = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Converter nome de aba para mês/ano (ex: "Out-25" -> { month: 10, year: 2025 })
const parseTabName = (tabName: string): { month: number; year: number } | null => {
  const match = tabName.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (!match) return null;
  
  const monthAbbr = match[1];
  const yearShort = parseInt(match[2], 10);
  
  const monthIndex = monthNames.findIndex(
    (m) => m.toLowerCase() === monthAbbr.toLowerCase()
  );
  
  if (monthIndex === -1) return null;
  
  return {
    month: monthIndex + 1,
    year: 2000 + yearShort,
  };
};

// Comparar se data1 <= data2
const isBeforeOrEqual = (
  m1: number, y1: number,
  m2: number, y2: number
): boolean => {
  if (y1 < y2) return true;
  if (y1 > y2) return false;
  return m1 <= m2;
};

const useUploadSheet = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const { toast } = useToast();

  // Parser para aba "Geral" - extrai faturamento mensal por ano
  const parseGeneralSheet = (
    worksheet: XLSX.WorkSheet,
    cutoffMonth: number,
    cutoffYear: number
  ): { historicalData: MonthlyData[]; currentYearData: MonthlyData[]; yearsAvailable: number[]; mentorshipStartDate?: string } => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    
    const historicalData: MonthlyData[] = [];
    const currentYearData: MonthlyData[] = [];
    const yearsAvailable: number[] = [];
    let mentorshipStartDate: string | undefined;
    
    // Detectar anos disponíveis (colunas B, C, D, E... que contêm anos)
    // Estrutura: Coluna A = Mês, Colunas B+ = Anos (2022, 2023, 2024, 2025...)
    const headerRow = jsonData[0] || [];
    const yearColumns: { col: number; year: number }[] = [];
    
    for (let col = 1; col < headerRow.length; col++) {
      const cellValue = headerRow[col];
      if (typeof cellValue === "number" && cellValue >= 2020 && cellValue <= 2030) {
        yearColumns.push({ col, year: cellValue });
        if (!yearsAvailable.includes(cellValue)) {
          yearsAvailable.push(cellValue);
        }
      }
    }
    
    // Procurar "Início Mentoria" na planilha (geralmente coluna K)
    for (let row = 0; row < Math.min(jsonData.length, 20); row++) {
      for (let col = 0; col < Math.min((jsonData[row] || []).length, 15); col++) {
        const cell = jsonData[row]?.[col];
        if (typeof cell === "string" && cell.toLowerCase().includes("início mentoria")) {
          // A data deve estar na célula adjacente ou abaixo
          const dateCell = jsonData[row]?.[col + 1] || jsonData[row + 1]?.[col];
          if (dateCell) {
            if (typeof dateCell === "number") {
              // Converter número de data Excel
              const date = XLSX.SSF.parse_date_code(dateCell);
              if (date) {
                mentorshipStartDate = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
              }
            } else if (typeof dateCell === "string") {
              mentorshipStartDate = dateCell;
            }
          }
        }
      }
    }
    
    // Extrair faturamento por mês - procurar linhas com nomes de meses
    for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row || !row[0]) continue;
      
      const monthCell = String(row[0]).trim();
      const monthIndex = monthNamesLong.findIndex(
        (m) => monthCell.toLowerCase().startsWith(m.toLowerCase())
      );
      
      if (monthIndex === -1) continue;
      
      // Para cada ano detectado, extrair o valor
      for (const { col, year } of yearColumns) {
        const revenueValue = row[col];
        const revenue = typeof revenueValue === "number" ? revenueValue : 
                       (typeof revenueValue === "string" ? parseFloat(revenueValue.replace(/[^0-9.,]/g, "").replace(",", ".")) : 0);
        
        if (!revenue && revenue !== 0) continue;
        
        // Aplicar corte: ignorar meses após o mês selecionado
        if (!isBeforeOrEqual(monthIndex + 1, year, cutoffMonth, cutoffYear)) {
          continue;
        }
        
        const monthData: MonthlyData = {
          month: monthNames[monthIndex],
          year,
          revenue: revenue || 0,
          goal: 0, // Meta será extraída de outra linha se existir
        };
        
        // Determinar se é ano atual ou histórico
        const currentYear = new Date().getFullYear();
        if (year === currentYear) {
          currentYearData.push(monthData);
        } else {
          historicalData.push(monthData);
        }
      }
    }
    
    yearsAvailable.sort();
    
    return { historicalData, currentYearData, yearsAvailable, mentorshipStartDate };
  };

  // Parser para aba mensal (ex: Out-25) - extrai equipe
  const parseMonthlyTab = (worksheet: XLSX.WorkSheet): Salesperson[] => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    const team: Salesperson[] = [];
    
    // Encontrar a coluna "Consultor Comercial" ou similar
    let consultorColIndex = -1;
    let revenueColIndex = -1;
    let goalColIndex = -1;
    
    // Procurar cabeçalhos
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 10); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = String(row[colIdx] || "").toLowerCase();
        if (cell.includes("consultor") || cell.includes("vendedor") || cell.includes("comercial")) {
          consultorColIndex = colIdx;
        }
        if (cell.includes("total") || cell.includes("realizado") || cell.includes("faturamento")) {
          if (revenueColIndex === -1) revenueColIndex = colIdx;
        }
        if (cell.includes("meta") || cell.includes("objetivo")) {
          if (goalColIndex === -1) goalColIndex = colIdx;
        }
      }
      if (consultorColIndex !== -1) break;
    }
    
    if (consultorColIndex === -1) {
      // Fallback: tentar encontrar nomes na primeira coluna
      consultorColIndex = 0;
    }
    
    // Extrair vendedores
    const startRow = consultorColIndex === 0 ? 1 : 
      jsonData.findIndex((row) => row && row[consultorColIndex] && 
        typeof row[consultorColIndex] === "string" && 
        !String(row[consultorColIndex]).toLowerCase().includes("consultor"));
    
    for (let rowIdx = Math.max(startRow, 1); rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row) continue;
      
      const nameCell = row[consultorColIndex];
      if (!nameCell || typeof nameCell !== "string") continue;
      
      const name = nameCell.trim();
      if (!name || name.toLowerCase() === "total" || name.toLowerCase().includes("consultor")) continue;
      
      // Extrair valores das semanas (colunas adjacentes)
      const weeks: SalespersonWeekly[] = [];
      let totalRevenue = 0;
      
      // Tentar extrair dados semanais
      for (let weekNum = 1; weekNum <= 5; weekNum++) {
        const weekCol = consultorColIndex + weekNum;
        const weekValue = row[weekCol];
        const revenue = typeof weekValue === "number" ? weekValue : 0;
        totalRevenue += revenue;
        weeks.push({
          week: weekNum,
          revenue,
          goal: 0,
        });
      }
      
      // Se não encontrou dados semanais, usar colunas de total
      if (totalRevenue === 0 && revenueColIndex !== -1) {
        const revenueCell = row[revenueColIndex];
        totalRevenue = typeof revenueCell === "number" ? revenueCell : 0;
      }
      
      const goalValue = goalColIndex !== -1 ? row[goalColIndex] : 0;
      const monthlyGoal = typeof goalValue === "number" ? goalValue : 0;
      
      team.push({
        id: String(team.length + 1),
        name,
        avatar: "",
        totalRevenue,
        monthlyGoal,
        active: true,
        weeks: weeks.length > 0 ? weeks : [
          { week: 1, revenue: 0, goal: 0 },
          { week: 2, revenue: 0, goal: 0 },
          { week: 3, revenue: 0, goal: 0 },
          { week: 4, revenue: 0, goal: 0 },
        ],
        totalSalesCount: 0,
      });
    }
    
    return team;
  };

  // Calcular KPIs baseados nos dados extraídos
  const calculateKPIs = (
    historicalData: MonthlyData[],
    currentYearData: MonthlyData[],
    team: Salesperson[],
    cutoffMonth: number,
    cutoffYear: number,
    mentorshipStartDate?: string
  ): DashboardData["kpis"] => {
    const currentMonth = monthNamesLong[cutoffMonth - 1];
    
    const annualGoal = currentYearData.reduce((sum, m) => sum + m.goal, 0);
    const annualRealized = currentYearData.reduce((sum, m) => sum + m.revenue, 0);
    
    // Calcular crescimento em relação ao ano anterior
    const lastYear = cutoffYear - 1;
    const lastYearData = historicalData.filter((m) => m.year === lastYear);
    const lastYearTotal = lastYearData.reduce((sum, m) => sum + m.revenue, 0);
    const lastYearGrowth = lastYearTotal > 0 ? ((annualRealized - lastYearTotal) / lastYearTotal) * 100 : 0;
    
    // Calcular crescimento pós-mentoria
    let mentorshipGrowth = 0;
    if (mentorshipStartDate) {
      const mentorshipDate = new Date(mentorshipStartDate);
      const mentorshipYear = mentorshipDate.getFullYear();
      const mentorshipMonth = mentorshipDate.getMonth() + 1;
      
      // Faturamento pré-mentoria (12 meses anteriores)
      const allData = [...historicalData, ...currentYearData];
      let preMentorshipRevenue = 0;
      let postMentorshipRevenue = 0;
      
      for (const monthData of allData) {
        const monthIndex = monthNames.indexOf(monthData.month) + 1;
        if (isBeforeOrEqual(monthIndex, monthData.year, mentorshipMonth, mentorshipYear)) {
          preMentorshipRevenue += monthData.revenue;
        } else if (isBeforeOrEqual(monthIndex, monthData.year, cutoffMonth, cutoffYear)) {
          postMentorshipRevenue += monthData.revenue;
        }
      }
      
      if (preMentorshipRevenue > 0) {
        mentorshipGrowth = ((postMentorshipRevenue - preMentorshipRevenue) / preMentorshipRevenue) * 100;
      }
    }
    
    const totalSalesCount = team.reduce((sum, t) => sum + t.totalSalesCount, 0);
    const activeCustomers = team.filter((t) => t.active).length * 50;
    
    return {
      annualGoal,
      annualRealized,
      lastYearGrowth: Math.round(lastYearGrowth * 10) / 10,
      mentorshipGrowth: Math.round(mentorshipGrowth * 10) / 10,
      currentMonthName: currentMonth,
      averageTicket: totalSalesCount > 0 ? Math.round(annualRealized / totalSalesCount) : 0,
      conversionRate: 0,
      cac: 0,
      ltv: 0,
      activeCustomers,
      totalSalesCount,
    };
  };

  const processFile = async (file: File, config: UploadConfig): Promise<UploadResult> => {
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      const sheetsFound = workbook.SheetNames;
      let rowCount = 0;
      
      let historicalData: MonthlyData[] = [];
      let currentYearData: MonthlyData[] = [];
      let team: Salesperson[] = [];
      let yearsAvailable: number[] = [];
      let mentorshipStartDate: string | undefined;
      
      const { selectedMonth, selectedYear } = config;
      const selectedMonthAbbr = monthNames[selectedMonth - 1];
      const selectedYearShort = String(selectedYear).slice(-2);
      const selectedTabName = `${selectedMonthAbbr}-${selectedYearShort}`;
      
      // Processar aba "Geral"
      const geralSheet = workbook.Sheets["Geral"] || workbook.Sheets["geral"] || workbook.Sheets["GERAL"];
      if (geralSheet) {
        const geralData = parseGeneralSheet(geralSheet, selectedMonth, selectedYear);
        historicalData = geralData.historicalData;
        currentYearData = geralData.currentYearData;
        yearsAvailable = geralData.yearsAvailable;
        mentorshipStartDate = geralData.mentorshipStartDate;
        
        const jsonData = XLSX.utils.sheet_to_json(geralSheet, { header: 1 }) as any[][];
        rowCount += jsonData.length - 1;
      }
      
      // Processar aba do mês selecionado para extrair equipe
      const monthlySheet = workbook.Sheets[selectedTabName];
      if (monthlySheet) {
        team = parseMonthlyTab(monthlySheet);
        const jsonData = XLSX.utils.sheet_to_json(monthlySheet, { header: 1 }) as any[][];
        rowCount += jsonData.length - 1;
      } else {
        // Tentar encontrar a aba mais próxima
        for (const sheetName of sheetsFound) {
          const parsed = parseTabName(sheetName);
          if (parsed && isBeforeOrEqual(parsed.month, parsed.year, selectedMonth, selectedYear)) {
            const sheet = workbook.Sheets[sheetName];
            team = parseMonthlyTab(sheet);
            break;
          }
        }
      }
      
      const kpis = calculateKPIs(
        historicalData,
        currentYearData,
        team,
        selectedMonth,
        selectedYear,
        mentorshipStartDate
      );
      
      const data: ProcessedData = {
        sheetsFound,
        rowCount,
        kpis,
        historicalData,
        currentYearData,
        team,
        yearsAvailable,
        selectedMonth: selectedTabName,
        mentorshipStartDate,
      };
      
      setProcessedData(data);
      setIsProcessing(false);
      
      return { success: true, data };
    } catch (error) {
      console.error("Error processing file:", error);
      setIsProcessing(false);
      return {
        success: false,
        error: "Erro ao processar o arquivo. Verifique se o formato está correto.",
      };
    }
  };

  const detectAvailableMonths = async (file: File): Promise<{ month: number; year: number; tabName: string }[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      const availableMonths: { month: number; year: number; tabName: string }[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const parsed = parseTabName(sheetName);
        if (parsed) {
          availableMonths.push({
            ...parsed,
            tabName: sheetName,
          });
        }
      }
      
      // Ordenar por data (mais recente primeiro)
      availableMonths.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      return availableMonths;
    } catch (error) {
      console.error("Error detecting months:", error);
      return [];
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
    detectAvailableMonths,
    reset,
  };
};

export default useUploadSheet;
