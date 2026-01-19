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

// Mapeamento de meses SEM ACENTO para busca normalizada
const monthNamesNormalized = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const monthAbbreviations = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Normalizar string: remover acentos e converter para lowercase
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .trim();
};

// Converter nome de aba para mês/ano (FLEXÍVEL)
// Aceita: "Dez-25", "DEZEMBRO-25", "dezembro 25", "Dezembro/2025", etc.
const parseTabName = (tabName: string): { month: number; year: number } | null => {
  const normalized = normalizeString(tabName);
  
  // Regex flexível: captura nome do mês (3+ letras) + separador + ano (2 ou 4 dígitos)
  // Separadores aceitos: -, /, espaço, _
  const match = normalized.match(/^([a-z]{3,})[\s\-\/\_]+(\d{2,4})$/);
  if (!match) {
    console.log(`[parseTabName] Não reconhecido: "${tabName}"`);
    return null;
  }
  
  const monthPart = match[1];
  let yearPart = parseInt(match[2], 10);
  
  // Se ano tem 2 dígitos, converter para 4 dígitos
  if (yearPart < 100) {
    yearPart = 2000 + yearPart;
  }
  
  // Tentar encontrar o mês por abreviação (3 letras)
  let monthIndex = monthAbbreviations.findIndex(abbr => monthPart.startsWith(abbr));
  
  // Se não encontrou por abreviação, tentar por nome completo
  if (monthIndex === -1) {
    monthIndex = monthNamesNormalized.findIndex(full => monthPart === full);
  }
  
  // Se ainda não encontrou, tentar por prefixo de nome completo (4+ letras)
  if (monthIndex === -1 && monthPart.length >= 4) {
    monthIndex = monthNamesNormalized.findIndex(full => full.startsWith(monthPart.substring(0, 4)));
  }
  
  if (monthIndex === -1) {
    console.log(`[parseTabName] Mês não reconhecido: "${monthPart}" (de "${tabName}")`);
    return null;
  }
  
  console.log(`[parseTabName] Reconhecido: "${tabName}" -> mês ${monthIndex + 1}, ano ${yearPart}`);
  
  return {
    month: monthIndex + 1,
    year: yearPart,
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

// Detectar formato de planilha
type SheetFormat = "template_simplificado" | "formato_legado";

const detectSheetFormat = (workbook: XLSX.WorkBook): SheetFormat => {
  // Se tem aba "Historico" ou "Histórico", é o formato simplificado
  const hasHistoricoTab = workbook.SheetNames.some(
    name => name.toLowerCase() === "historico" || name.toLowerCase() === "histórico"
  );
  
  if (hasHistoricoTab) {
    return "template_simplificado";
  }
  
  return "formato_legado";
};

// Parser para formato simplificado (Template)
const parseSimplifiedTemplate = (
  workbook: XLSX.WorkBook,
  cutoffMonth: number,
  cutoffYear: number
): {
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
  team: Salesperson[];
  yearsAvailable: number[];
} => {
  const historicalData: MonthlyData[] = [];
  const currentYearData: MonthlyData[] = [];
  const team: Salesperson[] = [];
  const yearsAvailable: number[] = [];

  // Encontrar aba de histórico
  const historicoSheetName = workbook.SheetNames.find(
    name => name.toLowerCase() === "historico" || name.toLowerCase() === "histórico"
  );

  if (historicoSheetName) {
    const worksheet = workbook.Sheets[historicoSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];

    console.log("[parseSimplifiedTemplate] Aba Historico encontrada, linhas:", jsonData.length);

    // Identificar colunas por header (linha 1)
    const header = (jsonData[0] || []).map((h: any) => String(h || "").toLowerCase());
    const colMes = header.findIndex(h => h.includes("mês") || h.includes("mes") || h === "month");
    const colAno = header.findIndex(h => h.includes("ano") || h === "year");
    const colFaturamento = header.findIndex(h => h.includes("faturamento") || h.includes("revenue") || h.includes("receita"));
    const colMeta = header.findIndex(h => h.includes("meta") || h.includes("goal"));

    console.log("[parseSimplifiedTemplate] Colunas detectadas:", { colMes, colAno, colFaturamento, colMeta });

    // Processar linhas de dados (a partir da linha 2)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const mesCell = row[colMes >= 0 ? colMes : 0];
      const anoCell = row[colAno >= 0 ? colAno : 1];
      const faturamentoCell = row[colFaturamento >= 0 ? colFaturamento : 2];
      const metaCell = row[colMeta >= 0 ? colMeta : 3];

      // Validar mês
      let monthName = "";
      if (typeof mesCell === "string") {
        const trimmed = mesCell.trim();
        const monthIdx = monthNamesLong.findIndex(m => 
          m.toLowerCase() === trimmed.toLowerCase() ||
          m.toLowerCase().startsWith(trimmed.toLowerCase().substring(0, 3))
        );
        if (monthIdx >= 0) {
          monthName = monthNames[monthIdx];
        }
      }

      if (!monthName) continue;

      // Validar ano
      let year = 0;
      if (typeof anoCell === "number") {
        year = anoCell;
      } else if (typeof anoCell === "string") {
        year = parseInt(anoCell, 10);
      }
      if (year < 2000 || year > 2100) continue;

      // Extrair faturamento
      let revenue = 0;
      if (typeof faturamentoCell === "number") {
        revenue = faturamentoCell;
      } else if (typeof faturamentoCell === "string") {
        revenue = parseFloat(faturamentoCell.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
      }

      // Extrair meta
      let goal = 0;
      if (typeof metaCell === "number") {
        goal = metaCell;
      } else if (typeof metaCell === "string") {
        goal = parseFloat(metaCell.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
      }

      // Registrar ano disponível
      if (!yearsAvailable.includes(year)) {
        yearsAvailable.push(year);
      }

      // Aplicar corte para ano selecionado
      const monthIndex = monthNames.indexOf(monthName) + 1;
      if (year === cutoffYear && !isBeforeOrEqual(monthIndex, year, cutoffMonth, cutoffYear)) {
        continue;
      }

      const monthData: MonthlyData = { month: monthName, year, revenue, goal };

      if (year === cutoffYear) {
        currentYearData.push(monthData);
      } else {
        historicalData.push(monthData);
      }
    }
  }

  // Encontrar aba de equipe
  const equipeSheetName = workbook.SheetNames.find(
    name => name.toLowerCase() === "equipe" || name.toLowerCase() === "team"
  );

  if (equipeSheetName) {
    const worksheet = workbook.Sheets[equipeSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];

    console.log("[parseSimplifiedTemplate] Aba Equipe encontrada, linhas:", jsonData.length);

    const header = (jsonData[0] || []).map((h: any) => String(h || "").toLowerCase());
    const colNome = header.findIndex(h => h.includes("nome") || h === "name");
    const colAtivo = header.findIndex(h => h.includes("ativo") || h === "active");

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const nome = String(row[colNome >= 0 ? colNome : 0] || "").trim();
      if (!nome || nome.toLowerCase().startsWith("//")) continue;

      const ativoCell = row[colAtivo >= 0 ? colAtivo : 4];
      const active = ativoCell !== "Não" && ativoCell !== "No" && ativoCell !== "false" && ativoCell !== "0" && ativoCell !== false;

      team.push({
        id: String(team.length + 1),
        name: nome,
        avatar: "",
        totalRevenue: 0,
        monthlyGoal: 0,
        active,
        weeks: [],
        totalSalesCount: 0,
      });
    }
  }

  yearsAvailable.sort();
  console.log("[parseSimplifiedTemplate] Resultado:", {
    historicalData: historicalData.length,
    currentYearData: currentYearData.length,
    team: team.length,
    yearsAvailable,
  });

  return { historicalData, currentYearData, team, yearsAvailable };
};

const useUploadSheet = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const { toast } = useToast();

  // Parser para aba "Geral" - extrai faturamento mensal por ano
  // Detecção ROBUSTA de anos: busca em mais colunas e aceita números ou strings numéricas
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
    
    // Helper: verificar se valor é um ano válido (2000-2100)
    const parseYearValue = (value: any): number | null => {
      if (typeof value === "number" && value >= 2000 && value <= 2100) {
        return value;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 2000 && num <= 2100 && String(num) === trimmed) {
          return num;
        }
      }
      return null;
    };
    
    // Detectar linha e colunas com anos - BUSCAR ATÉ 20 COLUNAS E 10 LINHAS
    let yearRowIndex = -1;
    let monthColIndex = 0; // Coluna onde estão os nomes dos meses
    const yearColumns: { col: number; year: number }[] = [];
    
    // Encontrar a linha que contém pelo menos 2 anos
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 10); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      const tempYearCols: { col: number; year: number }[] = [];
      
      // Buscar anos em até 20 colunas
      for (let col = 0; col < Math.min(row.length, 20); col++) {
        const yearVal = parseYearValue(row[col]);
        if (yearVal !== null) {
          tempYearCols.push({ col, year: yearVal });
        }
      }
      
      // Se encontrou pelo menos 2 anos na mesma linha, é a linha de anos
      if (tempYearCols.length >= 2) {
        yearRowIndex = rowIdx;
        tempYearCols.forEach(yc => {
          yearColumns.push(yc);
          if (!yearsAvailable.includes(yc.year)) {
            yearsAvailable.push(yc.year);
          }
        });
        console.log(`[parseGeneralSheet] Linha de anos encontrada no índice ${rowIdx}:`, tempYearCols);
        break;
      }
    }
    
    // Se não detectou automaticamente, usar mapeamento fixo como fallback
    if (yearColumns.length === 0) {
      console.log("[parseGeneralSheet] ⚠️ Usando mapeamento fixo de colunas (fallback)");
      yearRowIndex = 1;
      const fallbackYears = [
        { col: 1, year: 2022 },
        { col: 2, year: 2023 },
        { col: 3, year: 2024 },
        { col: 4, year: 2025 },
      ];
      yearColumns.push(...fallbackYears);
      fallbackYears.forEach(fy => yearsAvailable.push(fy.year));
    }
    
    console.log("[parseGeneralSheet] Linha de anos (1-indexed):", yearRowIndex + 1);
    console.log("[parseGeneralSheet] Anos detectados:", yearsAvailable);
    console.log("[parseGeneralSheet] Colunas de anos:", yearColumns);
    
    // Determinar coluna do mês (procurar nas primeiras 3 colunas da próxima linha após anos)
    const dataStartRow = yearRowIndex + 1;
    if (dataStartRow < jsonData.length) {
      const firstDataRow = jsonData[dataStartRow] || [];
      for (let col = 0; col < 3; col++) {
        const cellValue = String(firstDataRow[col] || "").trim();
        const isMonth = monthNamesLong.some(m => 
          cellValue.toLowerCase().startsWith(m.toLowerCase().substring(0, 3))
        );
        if (isMonth) {
          monthColIndex = col;
          console.log(`[parseGeneralSheet] Coluna de meses detectada: ${col} (valor: "${cellValue}")`);
          break;
        }
      }
    }
    
    // Detectar coluna de Meta (procurar por "Meta" na linha de anos ou acima)
    let metaColIndex = -1;
    for (let searchRow = Math.max(0, yearRowIndex - 1); searchRow <= yearRowIndex + 1; searchRow++) {
      const row = jsonData[searchRow] || [];
      for (let col = 0; col < Math.min(row.length, 20); col++) {
        const cell = String(row[col] || "").toLowerCase();
        if (cell.includes("meta") && cell.includes("prev")) {
          metaColIndex = col;
          console.log(`[parseGeneralSheet] Coluna de meta detectada: ${col}`);
          break;
        }
      }
      if (metaColIndex !== -1) break;
    }
    
    // Detectar coluna de Mentoria (buscar "mentoria" ou "início")
    let mentoriaColIndex = -1;
    for (let searchRow = 0; searchRow <= Math.min(jsonData.length, 5); searchRow++) {
      const row = jsonData[searchRow] || [];
      for (let col = 0; col < Math.min(row.length, 20); col++) {
        const cell = String(row[col] || "").toLowerCase();
        if (cell.includes("mentoria") || cell.includes("início ment")) {
          mentoriaColIndex = col;
          console.log(`[parseGeneralSheet] Coluna de mentoria detectada: ${col}`);
          break;
        }
      }
      if (mentoriaColIndex !== -1) break;
    }
    
    // Extrair data de início de mentoria
    if (mentoriaColIndex !== -1) {
      // Procurar a data nas próximas linhas da coluna de mentoria
      for (let r = 1; r <= 5; r++) {
        const mentoriaCell = jsonData[r]?.[mentoriaColIndex];
        if (mentoriaCell) {
          if (typeof mentoriaCell === "number") {
            const date = XLSX.SSF.parse_date_code(mentoriaCell);
            if (date) {
              mentorshipStartDate = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
              console.log("[parseGeneralSheet] Data de mentoria encontrada:", mentorshipStartDate);
              break;
            }
          } else if (typeof mentoriaCell === "string" && mentoriaCell.trim()) {
            const dateMatch = mentoriaCell.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (dateMatch) {
              const day = dateMatch[1].padStart(2, "0");
              const month = dateMatch[2].padStart(2, "0");
              let year = dateMatch[3];
              if (year.length === 2) year = "20" + year;
              mentorshipStartDate = `${year}-${month}-${day}`;
              console.log("[parseGeneralSheet] Data de mentoria (string parsed):", mentorshipStartDate);
              break;
            }
          }
        }
      }
    }
    
    console.log("[parseGeneralSheet] Dados começam na linha (1-indexed):", dataStartRow + 1);
    
    // Extrair faturamento por mês - iterar até encontrar "Total" ou completar 12 meses
    let monthsProcessed = 0;
    
    for (let rowIdx = dataStartRow; rowIdx < jsonData.length && monthsProcessed < 12; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row) continue;
      
      const monthCell = String(row[monthColIndex] || "").trim();
      
      // Parar se encontrar linha de total
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
      
      monthsProcessed++;
      const monthName = monthNames[monthIndex];
      
      // Extrair meta do mês (se coluna detectada)
      let goal = 0;
      if (metaColIndex !== -1) {
        const metaValue = row[metaColIndex];
        if (typeof metaValue === "number") {
          goal = metaValue;
        } else if (typeof metaValue === "string") {
          const cleanValue = metaValue.replace(/[R$\s.]/g, "").replace(",", ".");
          goal = parseFloat(cleanValue) || 0;
        }
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
          const cleanValue = revenueValue.replace(/[R$\s.]/g, "").replace(",", ".");
          revenue = parseFloat(cleanValue) || 0;
        }
        
        // Aplicar corte apenas para o ano selecionado
        if (year === cutoffYear && !isBeforeOrEqual(monthIndex + 1, year, cutoffMonth, cutoffYear)) {
          console.log(`[parseGeneralSheet] Ignorando ${monthName}/${year} (após cutoff ${cutoffMonth}/${cutoffYear})`);
          continue;
        }
        
        // Obter meta correspondente (usar a do ano atual se disponível)
        const monthGoal = year === cutoffYear ? (monthlyGoals.find(g => g.month === monthName)?.goal || 0) : 0;
        
        const monthData: MonthlyData = {
          month: monthName,
          year,
          revenue: revenue || 0,
          goal: monthGoal,
        };
        
        // Determinar se é ano selecionado (current) ou histórico
        if (year === cutoffYear) {
          currentYearData.push(monthData);
          console.log(`[parseGeneralSheet] Ano atual: ${monthName}/${year} = R$${revenue}, Meta: R$${monthGoal}`);
        } else {
          historicalData.push(monthData);
        }
      }
    }
    
    console.log("[parseGeneralSheet] ✅ Dados históricos:", historicalData.length, "registros");
    console.log("[parseGeneralSheet] ✅ Dados ano atual:", currentYearData.length, "registros");
    console.log("[parseGeneralSheet] Metas mensais:", monthlyGoals);
    
    yearsAvailable.sort();
    
    return { historicalData, currentYearData, yearsAvailable, mentorshipStartDate, monthlyGoals };
  };

  // Parser para aba mensal (ex: Out-25) - extrai equipe
  // Parser FLEXÍVEL: detecta automaticamente o layout da planilha
  const parseMonthlyTab = (worksheet: XLSX.WorkSheet): Salesperson[] => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    const team: Salesperson[] = [];
    
    console.log("[parseMonthlyTab] Total de linhas:", jsonData.length);
    if (jsonData.length === 0) return team;
    
    // PASSO 1: Detectar linha de cabeçalho e coluna do nome do vendedor
    // Buscar palavras-chave em várias colunas das primeiras 10 linhas
    let headerRowIndex = -1;
    let colNome = -1;
    
    const nameKeywords = ["consultor", "vendedor", "nome", "comercial", "representante"];
    
    for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 10); rowIdx++) {
      const row = jsonData[rowIdx] || [];
      for (let colIdx = 0; colIdx < Math.min(row.length, 20); colIdx++) {
        const cell = String(row[colIdx] || "").toLowerCase().trim();
        if (nameKeywords.some(kw => cell.includes(kw))) {
          headerRowIndex = rowIdx;
          colNome = colIdx;
          console.log(`[parseMonthlyTab] Cabeçalho encontrado: linha ${rowIdx + 1}, coluna ${colIdx + 1} ("${cell}")`);
          break;
        }
      }
      if (headerRowIndex !== -1) break;
    }
    
    // Se não encontrou cabeçalho, tentar heurística: linha com mais células preenchidas
    if (headerRowIndex === -1) {
      console.log("[parseMonthlyTab] Cabeçalho não encontrado por palavras-chave, usando heurística");
      let maxCells = 0;
      for (let rowIdx = 0; rowIdx < Math.min(jsonData.length, 5); rowIdx++) {
        const row = jsonData[rowIdx] || [];
        const filledCells = row.filter(c => c !== null && c !== "").length;
        if (filledCells > maxCells) {
          maxCells = filledCells;
          headerRowIndex = rowIdx;
        }
      }
      headerRowIndex = headerRowIndex === -1 ? 1 : headerRowIndex;
      colNome = 1; // Fallback: assumir coluna B
      console.log(`[parseMonthlyTab] Usando linha ${headerRowIndex + 1} como cabeçalho (heurística)`);
    }
    
    // PASSO 2: Detectar colunas de semanas, resultado e meta na linha de cabeçalho
    const headerRow = jsonData[headerRowIndex] || [];
    const weekColumns: number[] = [];
    let colResultado = -1;
    let colMeta = -1;
    
    // Verificar também linha abaixo (algumas planilhas têm datas na linha seguinte)
    const dateRow = jsonData[headerRowIndex + 1] || [];
    
    headerRow.forEach((cell, idx) => {
      const cellStr = String(cell || "").toLowerCase().trim();
      const dateStr = String(dateRow[idx] || "").toLowerCase().trim();
      
      // Detectar colunas de semanas: "semana X", "sem X", ou datas como "01 a 07/12"
      const isWeekColumn = 
        cellStr.includes("semana") || 
        cellStr.match(/^sem\s*\d/) ||
        /\d{1,2}\s*(a|\/|-|à)\s*\d{1,2}/.test(cellStr) ||
        /\d{1,2}\s*(a|\/|-|à)\s*\d{1,2}/.test(dateStr);
      
      if (isWeekColumn && !cellStr.includes("previsto") && !cellStr.includes("semanal")) {
        weekColumns.push(idx);
      }
      
      // Detectar coluna de resultado
      if (cellStr === "resultado" || cellStr === "total" || cellStr.includes("resultado")) {
        colResultado = idx;
      }
      
      // Detectar coluna de meta
      if (cellStr.includes("meta") && !cellStr.includes("previsto")) {
        colMeta = idx;
      }
    });
    
    // Se não detectou semanas pelo cabeçalho, usar posições fixas como fallback
    if (weekColumns.length === 0) {
      console.log("[parseMonthlyTab] Colunas de semana não detectadas, usando fallback");
      // Fallback: colunas E, G, I, K, M (índices 4, 6, 8, 10, 12)
      weekColumns.push(4, 6, 8, 10, 12);
    }
    
    // Fallback para resultado e meta
    if (colResultado === -1) colResultado = 15; // Coluna P
    if (colMeta === -1) colMeta = 17; // Coluna R
    
    console.log("[parseMonthlyTab] Layout detectado:", { 
      colNome, 
      weekColumns, 
      colResultado, 
      colMeta,
      headerRow: headerRowIndex + 1
    });
    
    // PASSO 3: Processar linhas de vendedores
    // Dados começam após o cabeçalho (pode ter linha de datas no meio)
    const hasDateRow = /\d{1,2}\s*(a|\/|-|à)\s*\d{1,2}/.test(String(dateRow[weekColumns[0]] || ""));
    const dataStartRow = headerRowIndex + (hasDateRow ? 2 : 1);
    
    console.log("[parseMonthlyTab] Dados começam na linha:", dataStartRow + 1);
    
    for (let rowIdx = dataStartRow; rowIdx < jsonData.length; rowIdx++) {
      const row = jsonData[rowIdx];
      if (!row) continue;
      
      const nameCell = row[colNome];
      if (!nameCell) continue;
      
      const name = String(nameCell).trim();
      if (!name || name.length < 2) continue;
      
      // Ignorar linhas de cabeçalho, total, ou palavras-chave
      const nameLower = name.toLowerCase();
      if (nameLower === "total" || nameLower === "totais") {
        console.log("[parseMonthlyTab] Linha de total encontrada, parando");
        break;
      }
      
      // Ignorar se parece ser cabeçalho
      if (nameKeywords.some(kw => nameLower.includes(kw))) continue;
      if (nameLower.includes("previsto")) continue;
      if (nameLower.includes("projetada")) continue;
      
      // NOVA VALIDAÇÃO FLEXÍVEL:
      // Considerar válido se:
      // 1. Tem número na coluna anterior (A), OU
      // 2. Tem algum valor numérico nas colunas de semana, OU
      // 3. Nome parece ser nome de pessoa (tem espaço ou é texto válido)
      const numCell = row[colNome - 1];
      const hasNumber = typeof numCell === "number" || (typeof numCell === "string" && /^\d+$/.test(numCell.trim()));
      
      const hasWeekValues = weekColumns.some(col => {
        const val = row[col];
        return typeof val === "number" && val > 0;
      });
      
      const looksLikeName = /^[A-Za-zÀ-ÿ\s]+$/.test(name) && name.length >= 3;
      
      if (!hasNumber && !hasWeekValues && !looksLikeName) {
        console.log(`[parseMonthlyTab] Linha ignorada (não parece vendedor): "${name}"`);
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
      
      // Extrair resultado e meta
      const resultadoCell = row[colResultado];
      const totalRevenue = typeof resultadoCell === "number" ? resultadoCell :
        (typeof resultadoCell === "string" ? parseFloat(resultadoCell.replace(/[^0-9.,]/g, "").replace(",", ".")) || totalWeeklyRevenue : totalWeeklyRevenue);
      
      const metaCell = row[colMeta];
      const monthlyGoal = typeof metaCell === "number" ? metaCell :
        (typeof metaCell === "string" ? parseFloat(metaCell.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0);
      
      console.log(`[parseMonthlyTab] ✓ Vendedor: ${name}, Semanas: ${weeks.filter(w => w.revenue > 0).length}, Resultado: R$${totalRevenue.toLocaleString()}, Meta: R$${monthlyGoal.toLocaleString()}`);
      
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
    
    console.log("[parseMonthlyTab] ✅ Total de vendedores encontrados:", team.length);
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
      
      // Detectar formato da planilha
      const format = detectSheetFormat(workbook);
      console.log("[processFile] Formato detectado:", format);
      
      if (format === "template_simplificado") {
        // Usar parser simplificado
        const simplifiedData = parseSimplifiedTemplate(workbook, selectedMonth, selectedYear);
        historicalData = simplifiedData.historicalData;
        currentYearData = simplifiedData.currentYearData;
        team = simplifiedData.team;
        yearsAvailable = simplifiedData.yearsAvailable;
        
        // Contar linhas
        const historicoSheet = workbook.Sheets[workbook.SheetNames.find(
          name => name.toLowerCase() === "historico" || name.toLowerCase() === "histórico"
        ) || ""];
        if (historicoSheet) {
          const jsonData = XLSX.utils.sheet_to_json(historicoSheet, { header: 1 }) as any[][];
          rowCount += jsonData.length - 1;
        }
      } else {
        // Usar parser legado
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
        // BUSCA FLEXÍVEL: construir lista de abas mensais parseáveis
        console.log("[processFile] Buscando aba mensal para vendedores...");
        console.log("[processFile] Mês/ano selecionado:", selectedMonth, selectedYear);
        
        // Construir lista de todas as abas mensais parseáveis
        const parseableMonthlyTabs: { sheetName: string; month: number; year: number }[] = [];
        for (const sheetName of sheetsFound) {
          const parsed = parseTabName(sheetName);
          if (parsed) {
            parseableMonthlyTabs.push({ sheetName, ...parsed });
          }
        }
        
        console.log("[processFile] Abas mensais detectadas:", parseableMonthlyTabs);
        
        // Ordenar por data (mais recente primeiro)
        parseableMonthlyTabs.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        
        // 1. Primeiro, tentar match exato por mês/ano
        let chosenTab = parseableMonthlyTabs.find(
          t => t.month === selectedMonth && t.year === selectedYear
        );
        
        // 2. Se não encontrou exato, pegar a aba mais recente <= cutoff
        if (!chosenTab) {
          chosenTab = parseableMonthlyTabs.find(
            t => isBeforeOrEqual(t.month, t.year, selectedMonth, selectedYear)
          );
        }
        
        // 3. Se ainda não encontrou, pegar a primeira disponível
        if (!chosenTab && parseableMonthlyTabs.length > 0) {
          chosenTab = parseableMonthlyTabs[0];
        }
        
        if (chosenTab) {
          console.log(`[processFile] ✅ Usando aba: "${chosenTab.sheetName}" (${chosenTab.month}/${chosenTab.year})`);
          const sheet = workbook.Sheets[chosenTab.sheetName];
          team = parseMonthlyTab(sheet);
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          rowCount += jsonData.length - 1;
        } else {
          console.log("[processFile] ⚠️ Nenhuma aba mensal encontrada para vendedores");
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
