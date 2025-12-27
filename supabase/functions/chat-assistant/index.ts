import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DashboardContext {
  companyName: string;
  businessSegment: string;
  annualGoal: number;
  annualRealized: number;
  lastYearGrowth: number;
  averageTicket: number;
  conversionRate: number;
  cac: number;
  ltv: number;
  activeCustomers: number;
  totalSalesCount: number;
  currentMonthRevenue: number;
  currentMonthGoal: number;
  currentMonthName: string;
  selectedYear: number;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json() as { 
      messages: ChatMessage[]; 
      context: DashboardContext;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Calculate derived metrics
    const progress = context.annualGoal > 0 
      ? (context.annualRealized / context.annualGoal) * 100 
      : 0;
    const monthlyProgress = context.currentMonthGoal > 0 
      ? (context.currentMonthRevenue / context.currentMonthGoal) * 100 
      : 0;
    const ltvCacRatio = context.cac > 0 ? context.ltv / context.cac : 0;
    const remaining = Math.max(0, context.annualGoal - context.annualRealized);

    const systemPrompt = `Você é um assistente de vendas inteligente e estratégico da empresa "${context.companyName}" (segmento: ${context.businessSegment}).

CONTEXTO ATUAL DOS DADOS (${context.selectedYear}):
- Meta Anual: R$ ${context.annualGoal.toLocaleString('pt-BR')}
- Realizado no Ano: R$ ${context.annualRealized.toLocaleString('pt-BR')} (${progress.toFixed(1)}% da meta)
- Faltam: R$ ${remaining.toLocaleString('pt-BR')}
- Crescimento vs Ano Anterior: ${context.lastYearGrowth > 0 ? '+' : ''}${context.lastYearGrowth}%

MÊS ATUAL (${context.currentMonthName}/${context.selectedYear}):
- Meta do Mês: R$ ${context.currentMonthGoal.toLocaleString('pt-BR')}
- Realizado: R$ ${context.currentMonthRevenue.toLocaleString('pt-BR')} (${monthlyProgress.toFixed(1)}%)

MÉTRICAS OPERACIONAIS:
- Ticket Médio: R$ ${context.averageTicket.toLocaleString('pt-BR')}
- Taxa de Conversão: ${context.conversionRate}%
- CAC: R$ ${context.cac.toLocaleString('pt-BR')}
- LTV: R$ ${context.ltv.toLocaleString('pt-BR')} (LTV/CAC: ${ltvCacRatio.toFixed(1)}x)
- Clientes Ativos: ${context.activeCustomers}
- Total de Vendas: ${context.totalSalesCount}

REGRAS DE RESPOSTA:
1. Seja conciso e direto, use bullet points quando apropriado
2. Sempre baseie suas análises nos dados fornecidos
3. Dê insights acionáveis e práticos
4. Use emojis com moderação para tornar a conversa mais amigável
5. Quando apropriado, faça cálculos baseados nos dados (ex: quanto falta para meta, média diária necessária)
6. Se perguntarem algo fora do contexto de vendas, redirecione educadamente
7. Responda em português brasileiro
8. Não invente dados que não estão no contexto`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ 
        role: m.role === "assistant" ? "assistant" : "user", 
        content: m.content 
      }))
    ];

    console.log("Calling Lovable AI Gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "rate_limit", 
            message: "Muitas requisições. Aguarde um momento e tente novamente." 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "payment_required", 
            message: "Créditos insuficientes. Entre em contato com o suporte." 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error("No content in AI response:", aiResponse);
      throw new Error("Resposta vazia da IA");
    }

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ 
        error: "internal_error",
        message: error instanceof Error ? error.message : "Erro interno do servidor"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
