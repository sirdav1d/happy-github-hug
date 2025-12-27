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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics } = await req.json() as { metrics: DashboardMetrics };
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[ai-insights] Generating insights for metrics:", metrics);

    const systemPrompt = `Você é um consultor de vendas experiente e motivador. Analise os dados de performance de vendas e forneça insights acionáveis e motivadores em português brasileiro.

Regras:
- Seja direto e objetivo (máximo 2-3 frases por insight)
- Use linguagem positiva e motivadora, mas realista
- Foque em ações concretas que podem ser tomadas
- Quando houver gap negativo, sugira estratégias de recuperação
- Use emojis com moderação (1-2 por insight)
- Retorne EXATAMENTE no formato JSON solicitado`;

    const userPrompt = `Analise estes dados de vendas e retorne insights em JSON:

DADOS:
- Meta anual: R$ ${metrics.annualGoal.toLocaleString('pt-BR')}
- Realizado no ano: R$ ${metrics.annualRealized.toLocaleString('pt-BR')} (${((metrics.annualRealized/metrics.annualGoal)*100).toFixed(1)}%)
- Crescimento vs ano anterior: ${metrics.lastYearGrowth.toFixed(1)}%
- Mês atual: ${metrics.currentMonthName}
- Receita do mês: R$ ${metrics.currentMonthRevenue.toLocaleString('pt-BR')}
- Meta do mês: R$ ${metrics.currentMonthGoal.toLocaleString('pt-BR')}
- Projeção (Run Rate): R$ ${metrics.runRateProjection.toLocaleString('pt-BR')}
- Gap para meta do mês: R$ ${metrics.gapToGoal.toLocaleString('pt-BR')}
- Dias úteis restantes: ${metrics.daysRemaining}
- Ticket médio: R$ ${metrics.averageTicket.toLocaleString('pt-BR')}
- Total de vendas: ${metrics.totalSalesCount}

Retorne APENAS este JSON (sem markdown, sem código):
{
  "healthScore": <número de 0 a 100 representando saúde geral do negócio>,
  "healthStatus": "<'excellent' | 'good' | 'warning' | 'critical'>",
  "mainInsight": "<insight principal motivador de 1-2 frases>",
  "actionItem": "<ação concreta recomendada>",
  "salesNeeded": <número de vendas necessárias para bater a meta do mês, baseado no ticket médio>,
  "dailyTarget": <meta diária para os dias restantes>
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
      console.error("[ai-insights] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded",
          fallback: generateFallbackInsights(metrics)
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          fallback: generateFallbackInsights(metrics)
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("[ai-insights] AI response:", content);

    // Parse the JSON from the response
    let insights;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[ai-insights] Failed to parse AI response, using fallback:", parseError);
      insights = generateFallbackInsights(metrics);
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[ai-insights] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackInsights(metrics: DashboardMetrics) {
  const progressPercent = (metrics.annualRealized / metrics.annualGoal) * 100;
  const monthProgressPercent = (metrics.currentMonthRevenue / metrics.currentMonthGoal) * 100;
  const salesNeeded = metrics.averageTicket > 0 
    ? Math.ceil(Math.max(0, metrics.gapToGoal) / metrics.averageTicket)
    : 0;
  const dailyTarget = metrics.daysRemaining > 0 
    ? Math.max(0, metrics.gapToGoal) / metrics.daysRemaining 
    : 0;
  
  let healthScore: number;
  let healthStatus: string;
  let mainInsight: string;
  let actionItem: string;

  if (monthProgressPercent >= 100) {
    healthScore = 95;
    healthStatus = 'excellent';
    mainInsight = `🎉 Parabéns! Meta de ${metrics.currentMonthName} batida! Continue acelerando para superar as expectativas.`;
    actionItem = 'Aproveite o momento e foque em upselling para clientes existentes.';
  } else if (monthProgressPercent >= 80) {
    healthScore = 80;
    healthStatus = 'good';
    mainInsight = `💪 Excelente progresso! Você está a ${(100 - monthProgressPercent).toFixed(0)}% de bater a meta de ${metrics.currentMonthName}.`;
    actionItem = `Faltam apenas ${salesNeeded} vendas para atingir a meta.`;
  } else if (monthProgressPercent >= 50) {
    healthScore = 60;
    healthStatus = 'warning';
    mainInsight = `⚡ Hora de acelerar! Meta de ${metrics.currentMonthName} precisa de um push final.`;
    actionItem = `Meta diária: R$ ${dailyTarget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} nos próximos ${metrics.daysRemaining} dias.`;
  } else {
    healthScore = 35;
    healthStatus = 'critical';
    mainInsight = `🚀 Momento de virada! Vamos recuperar o ritmo em ${metrics.currentMonthName}.`;
    actionItem = `Foque nas ${salesNeeded} vendas pendentes. Revise propostas em aberto.`;
  }

  return {
    healthScore,
    healthStatus,
    mainInsight,
    actionItem,
    salesNeeded,
    dailyTarget: Math.round(dailyTarget),
  };
}
