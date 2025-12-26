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
  // Estrutura real da planilha Geral (baseada no screenshot):
  // Linha 1 (índice 0): Título/Cabeçalho vazio ou "Crescimento % 2024 x 2025"
  // Linha 2 (índice 1): Anos (2022, 2023, 2024, 2025) nas colunas B, C, D, E
  // Linhas 3-14 (índice 2-13): Meses com faturamento
  // Coluna A: Nomes dos meses
  // Colunas B-E: Faturamento por ano (B=2022, C=2023, D=2024, E=2025)
  // Coluna F (índice 5): Crescimento % 2024 x 2025
  // Coluna G (índice 6): Meta prevista 2025
  // Coluna K (índice 10): Início mentoria (K3 contém a data)
  const parseGeneralSheet = (
    worksheet: XLSX.WorkSheet,
    cutoffMonth: number,
    cutoffYear: number
  ): { 
    historicalData: MonthlyData[]; 
    currentYearData: MonthlyData[]; 
    yearsAvailable: number[]; 
    mentorshipStartDate?: string;
    monthlyGoals: { month: string; goal: number }[];
  } => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    
    console.log("[parseGeneralSheet] Total de linhas:", jsonData.length);
    console.log("[parseGeneralSheet] Primeiras 5 linhas:", jsonData.slice(0, 5));
    
    const historicalData: MonthlyData[] = [];
    const currentYearData: MonthlyData[] = [];
    const yearsAvailable: number[] = [];
    const monthlyGoals: { month: string; goal: number }[] = [];
    let mentorshipStartDate: string | undefined;
    
    // Mapeamento fixo de colunas baseado no layout real:
    // B(1)=2022, C(2)=2023, D(3)=2024, E(4)=2025
    // G(6)=Meta prevista 2025
    // K(10)=Início mentoria
    const COL_YEAR_2022 = 1; // Coluna B
    const COL_YEAR_2023 = 2; // Coluna C
    const COL_YEAR_2024 = 3; // Coluna D
    const COL_YEAR_2025 = 4; // Coluna E
    const COL_META_2025 = 6; // Coluna G - Meta prevista 2025
    const COL_MENTORIA = 10; // Coluna K
    
    // Detectar linha com anos (procurar linha que contém anos como 2022, 2023, 2024, 2025)
    let yearRowIndex = -1;
    const yearColumns: { col: number; year: number }[] = [];
    
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 5); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      let foundYears = 0;
      
      for (let col = 1; col <= 5; col++) {
        const cellValue = row[col];
        if (typeof cellValue === "number" && cellValue >= 2020 && cellValue <= 2030) {
          if (yearRowIndex === -1) yearRowIndex = rowIdx;
          yearColumns.push({ col, year: cellValue });
          if (!yearsAvailable.includes(cellValue)) {
            yearsAvailable.push(cellValue);
          }
          foundYears++;
        }
      }
      if (foundYears >= 2) break; // Encontrou a linha de anos
    }
    
    // Se não detectou automaticamente, usar mapeamento fixo
    if (yearColumns.length === 0) {
      console.log("[parseGeneralSheet] Usando mapeamento fixo de colunas");
      yearRowIndex = 1;
      yearColumns.push(
        { col: COL_YEAR_2022, year: 2022 },
        { col: COL_YEAR_2023, year: 2023 },
        { col: COL_YEAR_2024, year: 2024 },
        { col: COL_YEAR_2025, year: 2025 }
      );
      yearsAvailable.push(2022, 2023, 2024, 2025);
    }
    
    console.log("[parseGeneralSheet] Linha de anos encontrada:", yearRowIndex + 1);
    console.log("[parseGeneralSheet] Anos detectados:", yearsAvailable);
    console.log("[parseGeneralSheet] Colunas de anos:", yearColumns);
    
    // Extrair data de início de mentoria da célula K3 (índice [2][10])
    const mentoriaRow = 2; // Linha 3 (índice 2)
    const mentoriaCell = jsonData[mentoriaRow]?.[COL_MENTORIA];
    console.log("[parseGeneralSheet] Célula K3 (mentoria):", mentoriaCell);
    
    if (mentoriaCell) {
      if (typeof mentoriaCell === "number") {
        // Converter número de data Excel
        const date = XLSX.SSF.parse_date_code(mentoriaCell);
        if (date) {
          mentorshipStartDate = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
          console.log("[parseGeneralSheet] Data de mentoria encontrada:", mentorshipStartDate);
        }
      } else if (typeof mentoriaCell === "string" && mentoriaCell.trim()) {
        // Tentar parsear string de data (dd/mm/yyyy ou similar)
        const dateMatch = mentoriaCell.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, "0");
          const month = dateMatch[2].padStart(2, "0");
          let year = dateMatch[3];
          if (year.length === 2) year = "20" + year;
          mentorshipStartDate = `${year}-${month}-${day}`;
          console.log("[parseGeneralSheet] Data de mentoria (string parsed):", mentorshipStartDate);
        } else {
          mentorshipStartDate = mentoriaCell.trim();
          console.log("[parseGeneralSheet] Data de mentoria (string):", mentorshipStartDate);
        }
      }
    }
    
    // Extrair faturamento por mês - linhas após a linha de anos
    const dataStartRow = yearRowIndex + 1;
    console.log("[parseGeneralSheet] Dados começam na linha:", dataStartRow + 1);
    
    for (let rowIdx = dataStartRow; rowIdx < Math.min(jsonData.length, dataStartRow + 14); rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row || !row[0]) continue;
      
      const monthCell = String(row[0]).trim();
      
      // Ignorar linhas de total ou vazias
      if (monthCell.toLowerCase() === "total" || monthCell.toLowerCase() === "") continue;
      
      // Tentar encontrar o índice do mês
      let monthIndex = monthNamesLong.findIndex(
        (m) => monthCell.toLowerCase() === m.toLowerCase()
      );
      
      // Se não encontrou exatamente, tentar prefixo
      if (monthIndex === -1) {
        monthIndex = monthNamesLong.findIndex(
          (m) => monthCell.toLowerCase().startsWith(m.toLowerCase().substring(0, 3))
        );
      }
      
      if (monthIndex === -1) {
        console.log("[parseGeneralSheet] Mês não reconhecido:", monthCell);
        continue;
      }
      
      const monthName = monthNames[monthIndex];
      
      // Extrair meta do mês (coluna G para 2025)
      const metaValue = row[COL_META_2025];
      let goal = 0;
      if (typeof metaValue === "number") {
        goal = metaValue;
      } else if (typeof metaValue === "string") {
        const cleanValue = metaValue.replace(/[R$\s.]/g, "").replace(",", ".");
        goal = parseFloat(cleanValue) || 0;
      }
      
      if (goal > 0) {
        monthlyGoals.push({ month: monthName, goal });
      }
      
      // Para cada ano detectado, extrair o valor
      for (const { col, year } of yearColumns) {
        const revenueValue = row[col];
        let revenue = 0;
        
        if (typeof revenueValue === "number") {
          revenue = revenueValue;
        } else if (typeof revenueValue === "string") {
          // Limpar string e converter
          const cleanValue = revenueValue.replace(/[R$\s.]/g, "").replace(",", ".");
          revenue = parseFloat(cleanValue) || 0;
        }
        
        // Aplicar corte apenas para o ano selecionado
        // Para anos históricos, manter todos os meses
        if (year === cutoffYear && !isBeforeOrEqual(monthIndex + 1, year, cutoffMonth, cutoffYear)) {
          console.log(`[parseGeneralSheet] Ignorando ${monthName}/${year} (após cutoff ${cutoffMonth}/${cutoffYear})`);
          continue;
        }
        
        // Pegar a meta correspondente (só existe para 2025)
        const monthGoal = year === 2025 ? (monthlyGoals.find(g => g.month === monthName)?.goal || 0) : 0;
        
        const monthData: MonthlyData = {
          month: monthName,
          year,
          revenue: revenue || 0,
          goal: monthGoal,
        };
        
        // Determinar se é ano selecionado (current) ou histórico
        // Usar o ano selecionado no upload, não o ano do sistema
        if (year === cutoffYear) {
          currentYearData.push(monthData);
          console.log(`[parseGeneralSheet] Ano atual: ${monthName}/${year} = R$${revenue}, Meta: R$${monthGoal}`);
        } else {
          historicalData.push(monthData);
        }
      }
    }
    
    console.log("[parseGeneralSheet] Dados históricos:", historicalData.length, "registros");
    console.log("[parseGeneralSheet] Dados ano atual:", currentYearData.length, "registros");
    console.log("[parseGeneralSheet] Metas mensais:", monthlyGoals);
    
    yearsAvailable.sort();
    
    return { historicalData, currentYearData, yearsAvailable, mentorshipStartDate, monthlyGoals };
  };

  // Parser para aba mensal (ex: Out-25) - extrai equipe
  // Estrutura real da planilha:
  // Linha 2 (índice 1): Cabeçalho com "CONSULTOR COMERCIAL"
  // Linha 3 (índice 2): Datas das semanas
  // Linhas 4+ (índice 3+): Dados dos vendedores
  // Coluna A (0): Número do vendedor
  // Coluna B (1): Nome do vendedor (CONSULTOR COMERCIAL)
  // Coluna C (2): Previsto diário
  // Coluna D (3): Previsto semanal
  // Coluna E (4): Semana 1 valor
  // Coluna G (6): Semana 2 valor
  // Coluna I (8): Semana 3 valor
  // Coluna K (10): Semana 4 valor
  // Coluna M (12): Semana 5 valor
  // Coluna P (15): Resultado (totalRevenue)
  // Coluna R (17): Meta Projetada (monthlyGoal)
  const parseMonthlyTab = (worksheet: XLSX.WorkSheet): Salesperson[] => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    const team: Salesperson[] = [];
    
    console.log("[parseMonthlyTab] Total de linhas:", jsonData.length);
    
    // Índices das colunas baseado na estrutura real
    const COL_NUMERO = 0;        // Coluna A - Número do vendedor
    const COL_NOME = 1;          // Coluna B - Nome do vendedor
    const COL_PREVISTO_DIARIO = 2;  // Coluna C
    const COL_PREVISTO_SEMANAL = 3; // Coluna D
    const COL_SEMANA_1 = 4;      // Coluna E
    const COL_SEMANA_2 = 6;      // Coluna G
    const COL_SEMANA_3 = 8;      // Coluna I
    const COL_SEMANA_4 = 10;     // Coluna K
    const COL_SEMANA_5 = 12;     // Coluna M
    const COL_RESULTADO = 15;    // Coluna P - Resultado final
    const COL_META = 17;         // Coluna R - Meta Projetada
    
    const weekColumns = [COL_SEMANA_1, COL_SEMANA_2, COL_SEMANA_3, COL_SEMANA_4, COL_SEMANA_5];
    
    // Encontrar a linha do cabeçalho "CONSULTOR COMERCIAL"
    let headerRowIndex = -1;
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 10); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      const cell = String(row[COL_NOME] || "").toLowerCase();
      if (cell.includes("consultor") || cell.includes("comercial")) {
        headerRowIndex = rowIdx;
        console.log("[parseMonthlyTab] Cabeçalho encontrado na linha:", rowIdx + 1);
        break;
      }
    }
    
    // Se não encontrou cabeçalho, assumir linha 1 (índice 1)
    if (headerRowIndex === -1) {
      headerRowIndex = 1;
      console.log("[parseMonthlyTab] Cabeçalho não encontrado, usando linha 2");
    }
    
    // Dados dos vendedores começam após a linha de datas (cabeçalho + 2)
    const dataStartRow = headerRowIndex + 2;
    console.log("[parseMonthlyTab] Dados começam na linha:", dataStartRow + 1);
    
    // Processar cada linha de vendedor
    for (let rowIdx = dataStartRow; rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row) continue;
      
      const nameCell = row[COL_NOME];
      
      // Validar nome do vendedor
      if (!nameCell || typeof nameCell !== "string") continue;
      
      const name = nameCell.trim();
      
      // Ignorar linhas vazias, totais, ou cabeçalhos
      if (!name) continue;
      if (name.toLowerCase() === "total") {
        console.log("[parseMonthlyTab] Linha de total encontrada, parando na linha:", rowIdx + 1);
        break;
      }
      if (name.toLowerCase().includes("consultor")) continue;
      if (name.toLowerCase().includes("comercial")) continue;
      
      // Verificar se a coluna A tem um número (indicando que é um vendedor válido)
      const numCell = row[COL_NUMERO];
      const isValidSalesperson = typeof numCell === "number" || 
        (typeof numCell === "string" && /^\d+$/.test(numCell.trim()));
      
      if (!isValidSalesperson) {
        console.log("[parseMonthlyTab] Linha ignorada (sem número):", name);
        continue;
      }
      
      // Extrair valores das semanas
      const weeks: SalespersonWeekly[] = [];
      let totalWeeklyRevenue = 0;
      
      for (let weekNum = 0; weekNum < weekColumns.length; weekNum++) {
        const weekCol = weekColumns[weekNum];
        const weekValue = row[weekCol];
        const revenue = typeof weekValue === "number" ? weekValue : 
          (typeof weekValue === "string" ? parseFloat(weekValue.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0);
        
        totalWeeklyRevenue += revenue;
        weeks.push({
          week: weekNum + 1,
          revenue,
          goal: 0,
        });
      }
      
      // Extrair resultado (Coluna P) e meta (Coluna R)
      const resultadoCell = row[COL_RESULTADO];
      const totalRevenue = typeof resultadoCell === "number" ? resultadoCell :
        (typeof resultadoCell === "string" ? parseFloat(resultadoCell.replace(/[^0-9.,]/g, "").replace(",", ".")) || totalWeeklyRevenue : totalWeeklyRevenue);
      
      const metaCell = row[COL_META];
      const monthlyGoal = typeof metaCell === "number" ? metaCell :
        (typeof metaCell === "string" ? parseFloat(metaCell.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0);
      
      console.log(`[parseMonthlyTab] Vendedor: ${name}, Resultado: ${totalRevenue}, Meta: ${monthlyGoal}`);
      
      team.push({
        id: String(team.length + 1),
        name,
        avatar: "",
        totalRevenue,
        monthlyGoal,
        active: true,
        weeks,
        totalSalesCount: 0,
      });
    }
    
    console.log("[parseMonthlyTab] Total de vendedores encontrados:", team.length);
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
    
    // Soma das metas e receitas do ano atual (até o mês de cutoff)
    const annualGoal = currentYearData.reduce((sum, m) => sum + m.goal, 0);
    const annualRealized = currentYearData.reduce((sum, m) => sum + m.revenue, 0);
    
    console.log("[calculateKPIs] Meta anual:", annualGoal);
    console.log("[calculateKPIs] Receita anual realizada:", annualRealized);
    console.log("[calculateKPIs] Dados do ano atual:", currentYearData);
    
    // Calcular crescimento em relação ao ano anterior (mesmo período)
    const lastYear = cutoffYear - 1;
    
    // Filtrar dados do ano anterior apenas para os mesmos meses do ano atual
    const currentYearMonths = currentYearData.map(m => m.month);
    const lastYearData = historicalData.filter(
      (m) => m.year === lastYear && currentYearMonths.includes(m.month)
    );
    
    const lastYearTotal = lastYearData.reduce((sum, m) => sum + m.revenue, 0);
    const lastYearGrowth = lastYearTotal > 0 
      ? ((annualRealized - lastYearTotal) / lastYearTotal) * 100 
      : 0;
    
    console.log(`[calculateKPIs] Ano anterior (${lastYear}):`, lastYearTotal);
    console.log(`[calculateKPIs] Crescimento vs ${lastYear}:`, lastYearGrowth.toFixed(1) + "%");
    
    // Calcular crescimento pós-mentoria
    let mentorshipGrowth = 0;
    if (mentorshipStartDate) {
      const mentorshipDate = new Date(mentorshipStartDate);
      const mentorshipYear = mentorshipDate.getFullYear();
      const mentorshipMonth = mentorshipDate.getMonth() + 1;
      
      console.log("[calculateKPIs] Data de mentoria:", mentorshipStartDate, "->", mentorshipMonth + "/" + mentorshipYear);
      
      // Faturamento pré e pós mentoria
      const allData = [...historicalData, ...currentYearData];
      let preMentorshipRevenue = 0;
      let postMentorshipRevenue = 0;
      
      for (const monthData of allData) {
        const monthIndex = monthNames.indexOf(monthData.month) + 1;
        
        // Antes da mentoria: comparar ano/mês
        const isBeforeMentorship = monthData.year < mentorshipYear || 
          (monthData.year === mentorshipYear && monthIndex < mentorshipMonth);
        
        // Após a mentoria: até o cutoff
        const isAfterMentorship = !isBeforeMentorship && 
          isBeforeOrEqual(monthIndex, monthData.year, cutoffMonth, cutoffYear);
        
        if (isBeforeMentorship) {
          preMentorshipRevenue += monthData.revenue;
        } else if (isAfterMentorship) {
          postMentorshipRevenue += monthData.revenue;
        }
      }
      
      console.log("[calculateKPIs] Receita pré-mentoria:", preMentorshipRevenue);
      console.log("[calculateKPIs] Receita pós-mentoria:", postMentorshipRevenue);
      
      if (preMentorshipRevenue > 0) {
        mentorshipGrowth = ((postMentorshipRevenue - preMentorshipRevenue) / preMentorshipRevenue) * 100;
      }
    }
    
    const totalSalesCount = team.reduce((sum, t) => sum + t.totalSalesCount, 0);
    const activeCustomers = team.filter((t) => t.active).length * 50;
    
    const kpis = {
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
    
    console.log("[calculateKPIs] KPIs calculados:", kpis);
    return kpis;
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
