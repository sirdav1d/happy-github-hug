import * as XLSX from "xlsx";
import { MonthlyData, Salesperson, SalespersonWeekly } from "@/types";

const monthNamesLong = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface NormalizedData {
  historicalData?: MonthlyData[];
  currentYearData?: MonthlyData[];
  team?: Salesperson[];
  kpis?: {
    annualGoal: number;
    annualRealized: number;
    lastYearGrowth: number;
    mentorshipGrowth: number;
  };
  yearsAvailable?: number[];
  selectedMonth?: string;
}

// Interface para dados do PGV (exportação)
export interface PGVExportData {
  team: Array<{
    id: string;
    name: string;
    dailyGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    weeks: Array<{ week: number; revenue: number; goal: number }>;
    totalRevenue: number;
    percentAchieved: number;
  }>;
  month: number;
  year: number;
  weeksInMonth: number;
  monthlyGoal: number;
  workingDaysPerWeek?: number[];
}

/**
 * Gera uma planilha modelo (template) vazia para o usuário preencher
 */
export function generateEmptyTemplate(): Blob {
  const workbook = XLSX.utils.book_new();

  // ======= Aba 1: Histórico =======
  const historicoData = [
    ["Mês", "Ano", "Faturamento"],
    ["Janeiro", 2022, 150000],
    ["Fevereiro", 2022, 165000],
    ["Março", 2022, 180000],
    ["", "", ""],
    ["// Preencha todos os meses de cada ano", "", ""],
    ["// A meta será calculada automaticamente (Histórico + 15%)", "", ""],
  ];
  const wsHistorico = XLSX.utils.aoa_to_sheet(historicoData);
  wsHistorico["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, wsHistorico, "Historico");

  // ======= Aba 2: Equipe =======
  const equipeData = [
    ["Nome", "Email", "Telefone", "Data Admissão", "Ativo"],
    ["João Silva", "joao@email.com", "11999999999", "01/03/2023", "Sim"],
    ["Maria Santos", "maria@email.com", "11988888888", "15/06/2023", "Sim"],
    ["", "", "", "", ""],
    ["// Liste todos os vendedores da equipe", "", "", "", ""],
    ["// Ativo: Sim ou Não", "", "", "", ""],
  ];
  const wsEquipe = XLSX.utils.aoa_to_sheet(equipeData);
  wsEquipe["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, wsEquipe, "Equipe");

  // ======= Aba 3: Vendas (opcional) =======
  const vendasData = [
    ["Data", "Valor", "Vendedor", "Cliente", "Novo Cliente", "Produto"],
    ["15/01/2025", 5000, "João Silva", "Empresa ABC", "Sim", "Consultoria"],
    ["18/01/2025", 3500, "Maria Santos", "Empresa XYZ", "Não", "Treinamento"],
    ["", "", "", "", "", ""],
    ["// Opcional: detalhe de vendas individuais", "", "", "", "", ""],
  ];
  const wsVendas = XLSX.utils.aoa_to_sheet(vendasData);
  wsVendas["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, wsVendas, "Vendas");

  // Gerar arquivo
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Gera uma planilha normalizada com os dados já processados
 * Permite ao usuário baixar, conferir e reenviar se necessário
 */
export function generateNormalizedSpreadsheet(data: NormalizedData): Blob {
  const workbook = XLSX.utils.book_new();

  // ======= Aba 1: Histórico Normalizado =======
  const historicoHeaders = ["Mês", "Ano", "Faturamento"];
  const historicoRows: any[][] = [historicoHeaders];

  // Combinar historical + currentYear e ordenar
  const allMonthlyData = [
    ...(data.historicalData || []),
    ...(data.currentYearData || []),
  ].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const monthOrder = (m: string) => monthNamesLong.findIndex(name => 
      name.toLowerCase().startsWith(m.toLowerCase().substring(0, 3))
    );
    return monthOrder(a.month) - monthOrder(b.month);
  });

  // Remover duplicatas (manter o primeiro registro de cada mês/ano)
  const seen = new Set<string>();
  const uniqueData = allMonthlyData.filter(item => {
    const key = `${item.year}-${item.month}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueData.forEach(item => {
    historicoRows.push([item.month, item.year, item.revenue]);
  });

  const wsHistorico = XLSX.utils.aoa_to_sheet(historicoRows);
  wsHistorico["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, wsHistorico, "Historico");

  // ======= Aba 2: Equipe =======
  const equipeHeaders = ["Nome", "Faturamento Atual", "Meta Mensal", "Ativo"];
  const equipeRows: any[][] = [equipeHeaders];

  (data.team || []).forEach(member => {
    equipeRows.push([
      member.name,
      member.totalRevenue,
      member.monthlyGoal,
      member.active ? "Sim" : "Não",
    ]);
  });

  const wsEquipe = XLSX.utils.aoa_to_sheet(equipeRows);
  wsEquipe["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(workbook, wsEquipe, "Equipe");

  // ======= Aba 3: Resumo (KPIs e Info) =======
  const resumoData = [
    ["Resumo dos Dados Importados", ""],
    ["", ""],
    ["Período Selecionado", data.selectedMonth || "N/A"],
    ["Anos Disponíveis", (data.yearsAvailable || []).join(", ")],
    ["", ""],
    ["KPIs Calculados", ""],
    ["Meta Anual", data.kpis?.annualGoal || 0],
    ["Realizado Anual", data.kpis?.annualRealized || 0],
    ["Crescimento vs Ano Anterior", `${data.kpis?.lastYearGrowth || 0}%`],
    ["Crescimento Pós-Mentoria", `${data.kpis?.mentorshipGrowth || 0}%`],
    ["", ""],
    ["Estatísticas", ""],
    ["Total de Meses com Dados", uniqueData.length],
    ["Total de Vendedores", (data.team || []).length],
    ["Vendedores Ativos", (data.team || []).filter(t => t.active).length],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo["!cols"] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

  // Gerar arquivo
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Dispara o download de um Blob como arquivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera uma planilha de PGV (Painel de Gestão à Vista) no formato Excel
 * Similar à estrutura das planilhas usadas pelo cliente
 */
export function generatePGVSpreadsheet(data: PGVExportData): Blob {
  const workbook = XLSX.utils.book_new();
  
  const monthName = monthNamesLong[data.month - 1];
  const monthAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][data.month - 1];
  
  // Calcular dias úteis por semana (default: 5 para todas)
  const workingDays = data.workingDaysPerWeek || Array(data.weeksInMonth).fill(5);
  
  // Headers dinâmicos baseados no número de semanas
  const headers: string[] = [
    "#",
    "CONSULTOR COMERCIAL",
    "Previsto Diário",
    "Previsto Semanal",
  ];
  
  // Adicionar colunas para cada semana (valor + %)
  for (let w = 1; w <= data.weeksInMonth; w++) {
    headers.push(`Semana ${w}`);
    headers.push("%");
  }
  
  headers.push("Resultado", "Meta", "Resultado %");
  
  // Linha de dias úteis por semana
  const daysRow: any[] = ["", "", "", "Dias úteis:"];
  for (let w = 0; w < data.weeksInMonth; w++) {
    daysRow.push(workingDays[w]);
    daysRow.push("");
  }
  daysRow.push("", "", "");
  
  // Construir linhas de dados
  const rows: any[][] = [headers, daysRow];
  
  data.team.forEach((salesperson, idx) => {
    const row: any[] = [
      idx + 1,
      salesperson.name,
      salesperson.dailyGoal,
      salesperson.weeklyGoal,
    ];
    
    // Adicionar valores de cada semana
    for (let w = 1; w <= data.weeksInMonth; w++) {
      const weekData = salesperson.weeks?.find(wk => wk.week === w);
      const weekRevenue = weekData?.revenue || 0;
      const weekPercent = salesperson.weeklyGoal > 0 
        ? ((weekRevenue / salesperson.weeklyGoal) * 100).toFixed(0) + "%" 
        : "0%";
      
      row.push(weekRevenue);
      row.push(weekPercent);
    }
    
    // Resultado, Meta e % final
    row.push(salesperson.totalRevenue);
    row.push(salesperson.monthlyGoal);
    row.push(salesperson.percentAchieved.toFixed(0) + "%");
    
    rows.push(row);
  });
  
  // Linha de totais
  const totalsRow: any[] = ["", "TOTAL", "", ""];
  let grandTotal = 0;
  let grandGoal = 0;
  
  for (let w = 1; w <= data.weeksInMonth; w++) {
    const weekTotal = data.team.reduce((sum, s) => {
      const weekData = s.weeks?.find(wk => wk.week === w);
      return sum + (weekData?.revenue || 0);
    }, 0);
    totalsRow.push(weekTotal);
    totalsRow.push("");
  }
  
  grandTotal = data.team.reduce((sum, s) => sum + s.totalRevenue, 0);
  grandGoal = data.team.reduce((sum, s) => sum + s.monthlyGoal, 0);
  const grandPercent = grandGoal > 0 ? ((grandTotal / grandGoal) * 100).toFixed(0) + "%" : "0%";
  
  totalsRow.push(grandTotal);
  totalsRow.push(grandGoal);
  totalsRow.push(grandPercent);
  
  rows.push(totalsRow);
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Definir larguras de colunas
  const colWidths: { wch: number }[] = [
    { wch: 4 },   // #
    { wch: 25 },  // Consultor
    { wch: 14 },  // Prev. Diário
    { wch: 14 },  // Prev. Semanal
  ];
  
  for (let w = 0; w < data.weeksInMonth; w++) {
    colWidths.push({ wch: 12 }); // Semana valor
    colWidths.push({ wch: 6 });  // %
  }
  
  colWidths.push({ wch: 14 }); // Resultado
  colWidths.push({ wch: 14 }); // Meta
  colWidths.push({ wch: 10 }); // Resultado %
  
  ws["!cols"] = colWidths;
  
  const sheetName = `${monthAbbr}-${String(data.year).slice(-2)}`;
  XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  
  // Gerar arquivo
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Analisa os dados processados e retorna um resumo para preview
 */
export interface DataAnalysis {
  yearsWithData: { year: number; months: number; totalRevenue: number }[];
  warnings: string[];
  teamCount: number;
  activeTeamCount: number;
  detectedFormat: "template_simplificado" | "formato_legado" | "desconhecido";
  totalMonthsWithData: number;
  // Novos campos para enriquecer o preview
  weeksDetectedPerMonth?: { month: string; year: number; weeks: number }[];
  potentialDuplicateNames?: { name1: string; name2: string }[];
}

export function analyzeProcessedData(data: NormalizedData): DataAnalysis {
  const allData = [
    ...(data.historicalData || []),
    ...(data.currentYearData || []),
  ];

  // Agrupar por ano
  const yearMap = new Map<number, { months: Set<string>; revenue: number }>();
  
  allData.forEach(item => {
    if (!yearMap.has(item.year)) {
      yearMap.set(item.year, { months: new Set(), revenue: 0 });
    }
    const yearData = yearMap.get(item.year)!;
    yearData.months.add(item.month);
    yearData.revenue += item.revenue;
  });

  const yearsWithData = Array.from(yearMap.entries())
    .map(([year, data]) => ({
      year,
      months: data.months.size,
      totalRevenue: data.revenue,
    }))
    .sort((a, b) => a.year - b.year);

  // Detectar warnings
  const warnings: string[] = [];
  
  yearsWithData.forEach(yd => {
    if (yd.months < 12 && yd.year < new Date().getFullYear()) {
      warnings.push(`${yd.year}: apenas ${yd.months} meses com dados (esperado: 12)`);
    }
    if (yd.totalRevenue === 0) {
      warnings.push(`${yd.year}: faturamento total é zero`);
    }
  });

  const team = data.team || [];
  if (team.length === 0 && allData.length > 0) {
    warnings.push("Nenhum vendedor detectado na planilha");
  }

  // Detectar nomes similares (possíveis duplicatas)
  const potentialDuplicateNames: { name1: string; name2: string }[] = [];
  const normalizeForComparison = (name: string) => 
    name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      const norm1 = normalizeForComparison(team[i].name);
      const norm2 = normalizeForComparison(team[j].name);
      
      // Checar se são muito similares (Levenshtein simplificado)
      if (norm1 === norm2 || 
          norm1.includes(norm2) || 
          norm2.includes(norm1) ||
          (Math.abs(norm1.length - norm2.length) <= 2 && 
           (norm1.startsWith(norm2.substring(0, 3)) || norm2.startsWith(norm1.substring(0, 3))))) {
        potentialDuplicateNames.push({
          name1: team[i].name,
          name2: team[j].name,
        });
      }
    }
  }

  if (potentialDuplicateNames.length > 0) {
    warnings.push(`${potentialDuplicateNames.length} possível(is) nome(s) duplicado(s) detectado(s)`);
  }

  // Detectar semanas por vendedor (se tiver dados de weeks)
  const weeksDetectedPerMonth: { month: string; year: number; weeks: number }[] = [];
  if (team.length > 0 && team[0].weeks && team[0].weeks.length > 0) {
    const selectedMonthParsed = data.selectedMonth?.match(/^([A-Za-z]{3})-(\d{2})$/);
    if (selectedMonthParsed) {
      const monthAbbr = selectedMonthParsed[1];
      const yearShort = parseInt(selectedMonthParsed[2], 10);
      const maxWeeks = Math.max(...team.map(t => t.weeks?.length || 0));
      
      weeksDetectedPerMonth.push({
        month: monthAbbr,
        year: 2000 + yearShort,
        weeks: maxWeeks,
      });
    }
  }

  return {
    yearsWithData,
    warnings,
    teamCount: team.length,
    activeTeamCount: team.filter(t => t.active).length,
    detectedFormat: data.yearsAvailable?.length ? "formato_legado" : "desconhecido",
    totalMonthsWithData: allData.length,
    weeksDetectedPerMonth,
    potentialDuplicateNames,
  };
}
