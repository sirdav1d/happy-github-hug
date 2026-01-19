import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamMember {
  id: string;
  name: string;
  revenue: number;
  goal: number;
  growth?: number;
  salesCount?: number;
  conversionRate?: number;
}

interface RMRInsightsRequest {
  team: TeamMember[];
  previousRMR?: {
    theme?: string;
    strategies?: string[];
    highlightedEmployeeName?: string;
  };
  previousMonthRevenue?: number;
  previousMonthGoal?: number;
  monthContext: {
    month: number;
    year: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { team, previousRMR, previousMonthRevenue, previousMonthGoal, monthContext }: RMRInsightsRequest = await req.json();

    console.log('Generating RMR insights for:', { teamSize: team?.length, monthContext });

    if (!team || team.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Team data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate team metrics
    const teamWithMetrics = team.map(member => {
      const achievement = member.goal > 0 ? (member.revenue / member.goal) * 100 : 0;
      const growth = member.growth || 0;
      return {
        ...member,
        achievement,
        growth,
        // Score based on multiple factors
        highlightScore: (achievement * 0.4) + (growth * 0.3) + ((member.conversionRate || 0) * 0.3)
      };
    });

    // Sort by highlight score
    const sortedByScore = [...teamWithMetrics].sort((a, b) => b.highlightScore - a.highlightScore);

    // Build prompt for Gemini
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonthName = monthNames[monthContext.month - 1];

    const teamSummary = teamWithMetrics.map(m => 
      `- ${m.name}: Faturamento R$ ${m.revenue.toLocaleString('pt-BR')}, Meta R$ ${m.goal.toLocaleString('pt-BR')}, Atingimento ${m.achievement.toFixed(1)}%, Crescimento ${m.growth}%`
    ).join('\n');

    const totalRevenue = team.reduce((sum, m) => sum + m.revenue, 0);
    const totalGoal = team.reduce((sum, m) => sum + m.goal, 0);
    const overallAchievement = totalGoal > 0 ? ((totalRevenue / totalGoal) * 100).toFixed(1) : 0;

    const prompt = `Você é um consultor de vendas experiente. Analise os dados da equipe de vendas e gere sugestões para a RMR (Reunião de Metas e Reconhecimento) de ${currentMonthName}/${monthContext.year}.

DADOS DA EQUIPE:
${teamSummary}

RESULTADOS GERAIS:
- Faturamento Total: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Meta Total: R$ ${totalGoal.toLocaleString('pt-BR')}
- Atingimento Geral: ${overallAchievement}%
${previousMonthRevenue ? `- Faturamento Mês Anterior: R$ ${previousMonthRevenue.toLocaleString('pt-BR')}` : ''}

${previousRMR ? `ÚLTIMA RMR:
- Tema: ${previousRMR.theme || 'Não definido'}
- Destaque Anterior: ${previousRMR.highlightedEmployeeName || 'Não houve'}
- Estratégias Anteriores: ${previousRMR.strategies?.join(', ') || 'Nenhuma'}` : ''}

INSTRUÇÕES:
Retorne um JSON com a seguinte estrutura (sem markdown, apenas JSON puro):
{
  "highlight_candidates": [
    {
      "employee_name": "Nome do vendedor",
      "score": 95,
      "reason": "Motivo claro e específico para ser destaque (máx 2 frases)"
    }
  ],
  "suggested_theme": "Tema motivacional curto e impactante",
  "theme_context": "Explicação de 1-2 frases de por que este tema é relevante para o momento",
  "suggested_strategies": ["Estratégia 1 específica", "Estratégia 2 específica", "Estratégia 3 específica"],
  "suggested_goal": número,
  "goal_reasoning": "Explicação curta do porquê desta meta"
}

REGRAS:
1. Destaque: Escolha com base em atingimento de meta, crescimento e consistência. Evite repetir o destaque anterior se houver outros candidatos fortes.
2. Tema: Seja criativo, evite clichês. O tema deve se conectar com o momento da equipe.
3. Estratégias: Sejam práticas e executáveis, não genéricas.
4. Meta sugerida: Considere crescimento de 5-15% sobre a meta atual, ajustado pela performance.

Responda APENAS com o JSON, sem texto adicional.`;

    // Call Lovable AI (Gemini)
    const geminiResponse = await fetch('https://bqoghpzvluixuddaerwk.supabase.co/functions/v1/proxy-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      
      // Fallback: Generate insights based on data analysis
      const topCandidate = sortedByScore[0];
      const fallbackInsights = {
        highlight_candidates: sortedByScore.slice(0, 3).map((member, index) => ({
          employee_id: member.id,
          employee_name: member.name,
          score: Math.round(100 - (index * 15)),
          reason: index === 0 
            ? `Melhor desempenho geral com ${member.achievement.toFixed(1)}% de atingimento da meta`
            : `Destaque em crescimento com ${member.growth}% de evolução`,
          metrics: {
            revenue: member.revenue,
            goal: member.goal,
            achievement: member.achievement,
            growth: member.growth
          }
        })),
        suggested_theme: Number(overallAchievement) >= 100 
          ? "Celebrar para Avançar: Nosso Sucesso é Apenas o Começo"
          : "Juntos Somos Mais Fortes: A Virada Começa Agora",
        theme_context: Number(overallAchievement) >= 100
          ? `A equipe superou a meta em ${(Number(overallAchievement) - 100).toFixed(1)}%. É hora de celebrar e definir novos desafios.`
          : `Com ${overallAchievement}% de atingimento, temos oportunidade de crescer juntos.`,
        suggested_strategies: [
          "Intensificar follow-up com leads quentes nos primeiros 10 dias do mês",
          "Implementar rotina diária de prospecção: mínimo 5 novos contatos por vendedor",
          "Foco em upsell para clientes ativos dos últimos 3 meses"
        ],
        suggested_goal: Math.round(totalGoal * 1.1),
        goal_reasoning: "Meta com crescimento de 10% sobre o período anterior, alinhada com a tendência da equipe."
      };

      return new Response(
        JSON.stringify(fallbackInsights),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData).slice(0, 500));

    let insights;
    try {
      // Extract the content from Gemini response
      const content = geminiData.choices?.[0]?.message?.content || geminiData.content || '';
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleanContent);
      
      // Add employee IDs back to candidates
      insights.highlight_candidates = insights.highlight_candidates?.map((candidate: any) => {
        const teamMember = teamWithMetrics.find(m => 
          m.name.toLowerCase().includes(candidate.employee_name?.toLowerCase()) ||
          candidate.employee_name?.toLowerCase().includes(m.name.toLowerCase())
        );
        return {
          ...candidate,
          employee_id: teamMember?.id || null,
          metrics: teamMember ? {
            revenue: teamMember.revenue,
            goal: teamMember.goal,
            achievement: teamMember.achievement,
            growth: teamMember.growth
          } : null
        };
      }) || [];

    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Use fallback
      const topCandidate = sortedByScore[0];
      insights = {
        highlight_candidates: sortedByScore.slice(0, 3).map((member, index) => ({
          employee_id: member.id,
          employee_name: member.name,
          score: Math.round(100 - (index * 15)),
          reason: `Desempenho de ${member.achievement.toFixed(1)}% no período`,
          metrics: {
            revenue: member.revenue,
            goal: member.goal,
            achievement: member.achievement,
            growth: member.growth
          }
        })),
        suggested_theme: "Foco e Determinação: O Caminho Para o Sucesso",
        theme_context: "Um tema atemporal para manter a equipe motivada e focada nos objetivos.",
        suggested_strategies: [
          "Revisar pipeline e priorizar oportunidades de maior valor",
          "Estabelecer metas diárias claras para cada vendedor",
          "Realizar check-ins semanais para ajustar estratégias"
        ],
        suggested_goal: Math.round(totalGoal * 1.1),
        goal_reasoning: "Crescimento projetado de 10% com base na capacidade atual da equipe."
      };
    }

    console.log('Generated insights successfully');
    
    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-rmr-insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
