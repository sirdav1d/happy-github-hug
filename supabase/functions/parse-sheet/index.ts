import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  goal: number;
}

interface Salesperson {
  id: string;
  name: string;
  avatar: string;
  totalRevenue: number;
  monthlyGoal: number;
  totalSalesCount: number;
  active: boolean;
  weeks: { week: number; revenue: number; goal: number }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error("No file provided in request");
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Read file as text for CSV parsing or use simple parsing for Excel
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    
    // Simple CSV parser
    const parseCSV = (csvText: string): string[][] => {
      const lines = csvText.split(/\r?\n/).filter(line => line.trim());
      return lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });
    };

    let sheetsFound: string[] = ['Dados'];
    let allData: string[][] = [];

    // Detect file type and parse accordingly
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      allData = parseCSV(text);
      console.log(`Parsed CSV: ${allData.length} rows`);
    } else {
      // For Excel files, we'll parse as CSV-like structure from the text representation
      // This is a simplified approach - for complex Excel files, use client-side xlsx library
      allData = parseCSV(text);
      console.log(`Parsed as text: ${allData.length} rows`);
    }

    let rowCount = Math.max(0, allData.length - 1);
    let historicalData: MonthlyData[] = [];
    let currentYearData: MonthlyData[] = [];
    let team: Salesperson[] = [];

    // Parse monthly data from rows
    const parseMonthlyData = (rows: string[][]): MonthlyData[] => {
      const result: MonthlyData[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[0] && row.length >= 2) {
          result.push({
            month: String(row[0]),
            year: Number(row[1]) || new Date().getFullYear(),
            revenue: Number(String(row[2]).replace(/[^0-9.-]/g, '')) || 0,
            goal: Number(String(row[3]).replace(/[^0-9.-]/g, '')) || 0,
          });
        }
      }
      
      return result;
    };

    // Parse team data from rows
    const parseTeamData = (rows: string[][]): Salesperson[] => {
      const result: Salesperson[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[0]) {
          result.push({
            id: String(i),
            name: String(row[0]),
            avatar: "",
            totalRevenue: Number(String(row[1]).replace(/[^0-9.-]/g, '')) || 0,
            monthlyGoal: Number(String(row[2]).replace(/[^0-9.-]/g, '')) || 0,
            totalSalesCount: Number(String(row[3]).replace(/[^0-9.-]/g, '')) || 0,
            active: row[4] !== "Não" && row[4] !== "No" && row[4] !== "false" && row[4] !== "0",
            weeks: [
              { week: 1, revenue: 0, goal: 0 },
              { week: 2, revenue: 0, goal: 0 },
              { week: 3, revenue: 0, goal: 0 },
              { week: 4, revenue: 0, goal: 0 },
            ],
          });
        }
      }
      
      return result;
    };

    // Detect data type from header
    if (allData.length > 0) {
      const header = allData[0].map(h => String(h).toLowerCase());
      
      if (header.some(h => h.includes('nome') || h.includes('vendedor') || h.includes('name'))) {
        team = parseTeamData(allData);
        console.log(`Detected team data: ${team.length} members`);
      } else if (header.some(h => h.includes('mês') || h.includes('mes') || h.includes('month'))) {
        currentYearData = parseMonthlyData(allData);
        console.log(`Detected monthly data: ${currentYearData.length} rows`);
      } else {
        // Default to monthly data
        currentYearData = parseMonthlyData(allData);
        console.log(`Default parse as monthly data: ${currentYearData.length} rows`);
      }
    }

    // Calculate KPIs
    const currentYear = new Date().getFullYear();
    const annualGoal = currentYearData.reduce((sum, m) => sum + m.goal, 0);
    const annualRealized = currentYearData.reduce((sum, m) => sum + m.revenue, 0);
    
    const lastYearData = historicalData.filter(m => m.year === currentYear - 1);
    const lastYearTotal = lastYearData.reduce((sum, m) => sum + m.revenue, 0);
    const lastYearGrowth = lastYearTotal > 0 ? ((annualRealized - lastYearTotal) / lastYearTotal) * 100 : 0;
    
    const totalSalesCount = team.reduce((sum, t) => sum + t.totalSalesCount, 0);
    const activeCustomers = team.filter(t => t.active).length * 50;

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const currentMonthName = months[new Date().getMonth()];

    const kpis = {
      annualGoal,
      annualRealized,
      lastYearGrowth: Math.round(lastYearGrowth * 10) / 10,
      mentorshipGrowth: 0,
      currentMonthName,
      averageTicket: totalSalesCount > 0 ? Math.round(annualRealized / totalSalesCount) : 0,
      conversionRate: 0,
      cac: 0,
      ltv: 0,
      activeCustomers,
      totalSalesCount,
    };

    const result = {
      success: true,
      data: {
        sheetsFound,
        rowCount,
        kpis,
        historicalData,
        currentYearData,
        team,
      }
    };

    console.log("Successfully processed file");

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Error processing file:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao processar arquivo: ' + errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
