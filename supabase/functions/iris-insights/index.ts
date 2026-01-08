import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardMetrics {
  annualGoal: number;
  annualRealized: number;
  lastYearGrowth: number;
  currentMonthRevenue: number;
  currentMonthGoal: number;
  runRateProjection: number;
  averageTicket: number;
  totalSalesCount: number;
  currentMonthName: string;
  gapToGoal: number;
  daysRemaining: number;
  selectedYear: number;
  conversionRate: number;
  ltv: number;
  cac: number;
  teamSize: number;
  teamAvgPerformance: number;
  topPerformerName?: string;
  topPerformerPercentage?: number;
  monthsAboveGoal: number;
  bestMonthName?: string;
  bestMonthRevenue?: number;
}

interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  metric?: string;
  priority: number;
  category: 'performance' | 'growth' | 'efficiency' | 'team' | 'opportunity';
  actionable?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics } = await req.json() as { metrics: DashboardMetrics };
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error("[iris-insights] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ 
        insights: generateFallbackInsights(metrics)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("[iris-insights] Generating comprehensive insights for:", {
      year: metrics.selectedYear,
      month: metrics.currentMonthName,
      progress: ((metrics.annualRealized / metrics.annualGoal) * 100).toFixed(1) + '%'
    });

    const systemPrompt = `Você é a IRIS (Inteligência de Resultados e Insights Estratégicos), uma consultora de vendas especialista e analítica. Sua função é analisar dados de performance comercial e gerar insights acionáveis, personalizados e estratégicos.

PERSONALIDADE:
- Direta e objetiva, mas empática
- Motivadora sem ser superficial
- Foca em ações concretas e mensuráveis
- Usa linguagem profissional mas acessível

REGRAS:
1. Analise TODOS os dados fornecidos e identifique padrões
2. Priorize insights por impacto no negócio
3. Cada insight deve ter uma ação clara
4. Use emojis com moderação (1 por insight no máximo)
5. Seja específico com números e percentuais
6. SEMPRE referencie o ano ${metrics.selectedYear}
7. Gere entre 4 e 8 insights, ordenados por prioridade
8. Retorne APENAS JSON válido, sem markdown`;

    const userPrompt = `Analise estes dados de vendas de ${metrics.currentMonthName}/${metrics.selectedYear} e retorne insights estratégicos:

PERFORMANCE ANUAL ${metrics.selectedYear}:
- Meta anual: R$ ${metrics.annualGoal.toLocaleString('pt-BR')}
- Realizado: R$ ${metrics.annualRealized.toLocaleString('pt-BR')} (${((metrics.annualRealized/metrics.annualGoal)*100).toFixed(1)}%)
- Crescimento vs ${metrics.selectedYear - 1}: ${metrics.lastYearGrowth >= 0 ? '+' : ''}${metrics.lastYearGrowth.toFixed(1)}%
- Meses acima da meta: ${metrics.monthsAboveGoal}/12

PERFORMANCE MENSAL (${metrics.currentMonthName}/${metrics.selectedYear}):
- Meta do mês: R$ ${metrics.currentMonthGoal.toLocaleString('pt-BR')}
- Realizado: R$ ${metrics.currentMonthRevenue.toLocaleString('pt-BR')} (${((metrics.currentMonthRevenue/metrics.currentMonthGoal)*100).toFixed(1)}%)
- Gap para meta: R$ ${metrics.gapToGoal.toLocaleString('pt-BR')}
- Dias úteis restantes: ${metrics.daysRemaining}
- Projeção Run Rate: R$ ${metrics.runRateProjection.toLocaleString('pt-BR')}

EFICIÊNCIA COMERCIAL:
- Ticket médio: R$ ${metrics.averageTicket.toLocaleString('pt-BR')}
- Taxa de conversão: ${metrics.conversionRate}%
- LTV: R$ ${metrics.ltv.toLocaleString('pt-BR')}
- CAC: R$ ${metrics.cac.toLocaleString('pt-BR')}
- LTV/CAC ratio: ${metrics.cac > 0 ? (metrics.ltv / metrics.cac).toFixed(1) : 'N/A'}x

EQUIPE:
- Tamanho: ${metrics.teamSize} vendedores ativos
- Performance média: ${metrics.teamAvgPerformance.toFixed(1)}%
${metrics.topPerformerName ? `- Top performer: ${metrics.topPerformerName} (${metrics.topPerformerPercentage?.toFixed(0)}% da meta)` : ''}
${metrics.bestMonthName ? `- Melhor mês de ${metrics.selectedYear}: ${metrics.bestMonthName} (R$ ${metrics.bestMonthRevenue?.toLocaleString('pt-BR')})` : ''}

Retorne APENAS este JSON (array de insights ordenados por prioridade):
{
  "insights": [
    {
      "id": "<identificador_unico>",
      "type": "<success|warning|danger|info>",
      "title": "<título conciso até 50 caracteres>",
      "description": "<análise objetiva em 2-3 frases>",
      "metric": "<métrica principal formatada, ex: '+15%' ou 'R$ 50k'>",
      "priority": <1 a 8, onde 1 é mais importante>,
      "category": "<performance|growth|efficiency|team|opportunity>",
      "actionable": "<ação específica recomendada em 1 frase>"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[iris-insights] AI gateway error:", response.status, errorText);
      
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ 
          insights: generateFallbackInsights(metrics),
          fromFallback: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("[iris-insights] AI response received, parsing...");

    let insights: AIInsight[];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || [];
        insights = insights.sort((a, b) => a.priority - b.priority);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[iris-insights] Parse error, using fallback:", parseError);
      insights = generateFallbackInsights(metrics);
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[iris-insights] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackInsights(metrics: DashboardMetrics): AIInsight[] {
  const insights: AIInsight[] = [];
  const annualProgress = (metrics.annualRealized / metrics.annualGoal) * 100;
  const monthProgress = metrics.currentMonthGoal > 0 
    ? (metrics.currentMonthRevenue / metrics.currentMonthGoal) * 100 
    : 0;
  const salesNeeded = metrics.averageTicket > 0 
    ? Math.ceil(Math.max(0, metrics.gapToGoal) / metrics.averageTicket)
    : 0;
  const ltvCacRatio = metrics.cac > 0 ? metrics.ltv / metrics.cac : 0;

  // 1. Performance mensal
  if (monthProgress >= 100) {
    insights.push({
      id: 'month-goal-achieved',
      type: 'success',
      title: `🎉 Meta de ${metrics.currentMonthName} Batida!`,
      description: `Você atingiu ${monthProgress.toFixed(0)}% da meta. Continue o ritmo para superar expectativas.`,
      metric: `${monthProgress.toFixed(0)}%`,
      priority: 1,
      category: 'performance',
      actionable: 'Foque em upselling para clientes existentes.'
    });
  } else if (monthProgress >= 70) {
    insights.push({
      id: 'month-on-track',
      type: 'success',
      title: '💪 Boa Performance Mensal',
      description: `Faltam ${(100 - monthProgress).toFixed(0)}% para bater a meta. São aproximadamente ${salesNeeded} vendas.`,
      metric: `${salesNeeded} vendas`,
      priority: 1,
      category: 'performance',
      actionable: 'Priorize follow-up com propostas em aberto.'
    });
  } else {
    insights.push({
      id: 'month-needs-push',
      type: 'warning',
      title: '⚡ Acelere Este Mês',
      description: `${metrics.currentMonthName} está em ${monthProgress.toFixed(0)}%. Meta diária: R$ ${(metrics.gapToGoal / Math.max(1, metrics.daysRemaining)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`,
      metric: `${metrics.daysRemaining} dias`,
      priority: 1,
      category: 'performance',
      actionable: 'Revise todas as propostas pendentes hoje.'
    });
  }

  // 2. Crescimento anual
  if (metrics.lastYearGrowth > 10) {
    insights.push({
      id: 'growth-strong',
      type: 'success',
      title: '📈 Crescimento Sólido',
      description: `+${metrics.lastYearGrowth.toFixed(1)}% vs ano anterior. Suas estratégias estão funcionando.`,
      metric: `+${metrics.lastYearGrowth.toFixed(0)}%`,
      priority: 2,
      category: 'growth',
      actionable: 'Documente e replique as ações que geraram resultado.'
    });
  } else if (metrics.lastYearGrowth < 0) {
    insights.push({
      id: 'growth-negative',
      type: 'danger',
      title: '📉 Queda vs Ano Anterior',
      description: `${metrics.lastYearGrowth.toFixed(1)}% de redução. É hora de revisar estratégias de captação.`,
      metric: `${metrics.lastYearGrowth.toFixed(0)}%`,
      priority: 2,
      category: 'growth',
      actionable: 'Analise o que mudou e ajuste o processo de vendas.'
    });
  }

  // 3. Eficiência (LTV/CAC)
  if (ltvCacRatio >= 3) {
    insights.push({
      id: 'efficiency-excellent',
      type: 'success',
      title: '💰 Ótima Eficiência Comercial',
      description: `LTV/CAC de ${ltvCacRatio.toFixed(1)}x indica retorno saudável sobre aquisição de clientes.`,
      metric: `${ltvCacRatio.toFixed(1)}x`,
      priority: 3,
      category: 'efficiency',
      actionable: 'Considere aumentar investimento em marketing.'
    });
  } else if (ltvCacRatio > 0 && ltvCacRatio < 2) {
    insights.push({
      id: 'efficiency-low',
      type: 'warning',
      title: '⚠️ LTV/CAC Precisa Melhorar',
      description: `Ratio de ${ltvCacRatio.toFixed(1)}x está abaixo do ideal (3x). Custo de aquisição muito alto.`,
      metric: `${ltvCacRatio.toFixed(1)}x`,
      priority: 3,
      category: 'efficiency',
      actionable: 'Reduza CAC ou aumente ticket médio/recorrência.'
    });
  }

  // 4. Conversão
  if (metrics.conversionRate >= 30) {
    insights.push({
      id: 'conversion-high',
      type: 'success',
      title: '🎯 Conversão Acima da Média',
      description: `Taxa de ${metrics.conversionRate}% indica excelente qualificação de leads e processo de vendas.`,
      metric: `${metrics.conversionRate}%`,
      priority: 4,
      category: 'efficiency',
      actionable: 'Mantenha os padrões de qualificação atuais.'
    });
  } else if (metrics.conversionRate > 0 && metrics.conversionRate < 15) {
    insights.push({
      id: 'conversion-low',
      type: 'warning',
      title: '🔄 Oportunidade na Conversão',
      description: `Taxa de ${metrics.conversionRate}% indica espaço para melhorar qualificação ou abordagem.`,
      metric: `${metrics.conversionRate}%`,
      priority: 4,
      category: 'efficiency',
      actionable: 'Revise critérios de qualificação de leads.'
    });
  }

  // 5. Equipe
  if (metrics.teamAvgPerformance >= 100) {
    insights.push({
      id: 'team-excelling',
      type: 'success',
      title: '👥 Equipe Acima da Meta',
      description: `Performance média de ${metrics.teamAvgPerformance.toFixed(0)}%. Time alinhado e entregando resultados.`,
      metric: `${metrics.teamAvgPerformance.toFixed(0)}%`,
      priority: 5,
      category: 'team',
      actionable: 'Reconheça publicamente os top performers.'
    });
  } else if (metrics.teamAvgPerformance < 80 && metrics.teamSize > 0) {
    insights.push({
      id: 'team-needs-support',
      type: 'warning',
      title: '👥 Equipe Precisa de Suporte',
      description: `Performance média de ${metrics.teamAvgPerformance.toFixed(0)}%. Identifique gaps individuais.`,
      metric: `${metrics.teamAvgPerformance.toFixed(0)}%`,
      priority: 5,
      category: 'team',
      actionable: 'Agende FIVIs individuais esta semana.'
    });
  }

  // 6. Ticket médio
  if (metrics.averageTicket > 0) {
    insights.push({
      id: 'ticket-info',
      type: 'info',
      title: '🎫 Ticket Médio Atual',
      description: `R$ ${metrics.averageTicket.toLocaleString('pt-BR')} por venda. Considere estratégias de upsell.`,
      metric: `R$ ${(metrics.averageTicket / 1000).toFixed(1)}k`,
      priority: 6,
      category: 'opportunity',
      actionable: 'Crie pacotes premium para aumentar ticket.'
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
