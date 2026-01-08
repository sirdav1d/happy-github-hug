import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  userId: string;
  reportType: 'monthly' | 'quarterly' | 'rmr';
  month?: number;
  year?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, reportType, month, year }: ReportRequest = await req.json();

    console.log(`Generating ${reportType} report for user ${userId}`);

    // Fetch dashboard data
    const { data: dashboard, error: dashError } = await supabase
      .from('dashboard_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (dashError) throw dashError;

    // Fetch sales for the period
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0]);

    if (salesError) throw salesError;

    // Calculate metrics
    const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;
    const totalSales = sales?.length || 0;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const team = (dashboard?.team as any[]) || [];
    const kpis = dashboard?.kpis as any;

    // Calculate team performance
    const teamPerformance = team.map(member => {
      const memberSales = sales?.filter(s => s.salesperson_id === member.id) || [];
      const memberRevenue = memberSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      const progress = member.monthlyGoal > 0 ? (memberRevenue / member.monthlyGoal) * 100 : 0;
      
      return {
        name: member.name,
        revenue: memberRevenue,
        goal: member.monthlyGoal,
        progress: progress.toFixed(1),
        salesCount: memberSales.length,
      };
    }).sort((a, b) => Number(b.revenue) - Number(a.revenue));

    // Generate report content
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const reportData = {
      title: `Relatório ${reportType === 'monthly' ? 'Mensal' : reportType === 'quarterly' ? 'Trimestral' : 'RMR'}`,
      period: `${monthNames[currentMonth - 1]} de ${currentYear}`,
      companyName: dashboard?.company_name || 'Empresa',
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue,
        totalSales,
        avgTicket,
        monthlyGoal: kpis?.monthlyGoal || 0,
        progress: kpis?.monthlyGoal ? ((totalRevenue / kpis.monthlyGoal) * 100).toFixed(1) : '0',
      },
      teamPerformance,
      insights: generateInsights(totalRevenue, kpis?.monthlyGoal || 0, teamPerformance),
    };

    console.log("Report generated successfully");

    return new Response(JSON.stringify(reportData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateInsights(revenue: number, goal: number, team: any[]): string[] {
  const insights: string[] = [];
  const progress = goal > 0 ? (revenue / goal) * 100 : 0;

  if (progress >= 100) {
    insights.push(`✅ Meta atingida! Parabéns pela performance excepcional.`);
  } else if (progress >= 80) {
    insights.push(`📈 Você está a ${(100 - progress).toFixed(0)}% de atingir a meta. Foco na reta final!`);
  } else if (progress >= 50) {
    insights.push(`⚠️ Atenção: apenas ${progress.toFixed(0)}% da meta foi atingida. Intensifique as ações.`);
  } else {
    insights.push(`🚨 Meta em risco. Considere revisar estratégias urgentemente.`);
  }

  const topPerformer = team[0];
  if (topPerformer) {
    insights.push(`🏆 Destaque: ${topPerformer.name} lidera com R$ ${topPerformer.revenue.toLocaleString('pt-BR')}`);
  }

  const underperformers = team.filter(m => Number(m.progress) < 70);
  if (underperformers.length > 0) {
    insights.push(`📊 ${underperformers.length} vendedor(es) abaixo de 70% da meta precisam de acompanhamento.`);
  }

  return insights;
}

serve(handler);
