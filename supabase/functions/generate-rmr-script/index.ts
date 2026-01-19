import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamMember {
  id: string;
  name: string;
  revenue: number;
  goal: number;
}

interface RMRData {
  highlight: {
    name: string;
    reason: string;
  };
  theme: string;
  goal: number;
  strategies: string[];
  video?: {
    title: string;
    url: string;
  };
  previousMonth: {
    revenue: number;
    goal: number;
  };
  team: TeamMember[];
  month: number;
  year: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rmrData } = await req.json() as { rmrData: RMRData };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthName = monthNames[rmrData.month - 1] || "Mês";

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
      }).format(value);
    };

    const percentAchieved = rmrData.previousMonth.goal > 0 
      ? ((rmrData.previousMonth.revenue / rmrData.previousMonth.goal) * 100).toFixed(1)
      : "0";

    // Prepare team summary with more detail
    const sortedTeam = [...rmrData.team].sort((a, b) => b.revenue - a.revenue);
    const topPerformers = sortedTeam.slice(0, 5);
    const underperformers = sortedTeam.filter(p => p.goal > 0 && (p.revenue / p.goal) < 0.8);

    const teamSummary = topPerformers.map((p, i) => 
      `${i + 1}. ${p.name}: ${formatCurrency(p.revenue)} (${p.goal > 0 ? ((p.revenue/p.goal)*100).toFixed(0) : 0}% da meta)`
    ).join("\n");

    const underperformersSummary = underperformers.length > 0 
      ? underperformers.slice(0, 3).map(p => 
          `- ${p.name}: ${((p.revenue/p.goal)*100).toFixed(0)}% da meta`
        ).join("\n")
      : "Todos acima de 80% da meta!";

    // Calculate team metrics
    const totalTeamRevenue = rmrData.team.reduce((sum, p) => sum + p.revenue, 0);
    const avgTicket = rmrData.team.length > 0 ? totalTeamRevenue / rmrData.team.length : 0;

    const prompt = `Você é um consultor especialista em gestão comercial com 20 anos de experiência conduzindo reuniões motivacionais de alta performance. Sua missão é criar um ROTEIRO COMPLETO e PROFISSIONAL para uma Reunião de Metas e Reconhecimento (RMR).

=== DADOS DA RMR DE ${monthName.toUpperCase()} ${rmrData.year} ===

RESULTADOS DO MÊS ANTERIOR:
- Faturamento Realizado: ${formatCurrency(rmrData.previousMonth.revenue)}
- Meta Definida: ${formatCurrency(rmrData.previousMonth.goal)}
- Percentual Atingido: ${percentAchieved}%
- Total da Equipe: ${rmrData.team.length} vendedores

RANKING DOS TOP PERFORMERS:
${teamSummary}

VENDEDORES ABAIXO DE 80%:
${underperformersSummary}

COLABORADOR DESTAQUE DO MÊS:
- Nome: ${rmrData.highlight.name}
- Motivo: ${rmrData.highlight.reason}

META DO PRÓXIMO MÊS: ${formatCurrency(rmrData.goal)}
TEMA MOTIVACIONAL: "${rmrData.theme}"
${rmrData.video ? `VÍDEO MOTIVACIONAL: "${rmrData.video.title}"` : ""}

ESTRATÉGIAS DEFINIDAS:
${rmrData.strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}

=== REGRAS DA METODOLOGIA RMR ===

A RMR segue uma estrutura rígida de 45 minutos dividida em 6 seções. Cada seção tem regras específicas:

1. ABERTURA (5 min)
   - REGRA: NUNCA comece com "bom dia" seco ou formal
   - DINÂMICA: Comece com energia alta - música ambiente, palmas coletivas
   - OBJETIVO: Criar ruptura com a rotina, elevar o nível de energia do grupo
   - CHECKLIST: Som/música preparado, sala organizada em semicírculo

2. RESULTADOS DO MÊS (10 min)
   - REGRA: SEMPRE comece pelo POSITIVO antes de qualquer crítica
   - DINÂMICA: Cada vendedor anuncia seu próprio resultado (empoderamento)
   - VISUAL: Mostrar gráfico de barras comparando meta vs realizado
   - EVITAR: Tom de cobrança ou julgamento - foco em aprendizado
   - TÉCNICA: Para resultados ruins, use "O que aprendemos?" em vez de "Por que não bateu?"

3. RECONHECIMENTO (5 min) 
   - REGRA: Este é o momento ÉPICO da reunião - trate como uma premiação
   - DINÂMICA: Palmas de pé, música de entrada para o destaque
   - STORYTELLING: Conte a história de COMO ele conseguiu, não apenas O QUE conseguiu
   - PREMIAÇÃO: Sempre tenha algo simbólico (certificado, badge, foto para mural)
   - IMPACTO: Todos devem sair querendo ser o próximo destaque

4. MOMENTO MOTIVACIONAL (10 min)
   - REGRA: O vídeo deve ter introdução e conclusão conectando ao contexto
   - DINÂMICA PÓS-VÍDEO: Reflexão em duplas (2 min) + compartilhamento (3 min)
   - CONEXÃO: Relacione a mensagem do vídeo com os desafios reais da equipe
   - PERGUNTA-CHAVE: "O que você leva desse vídeo para aplicar essa semana?"

5. METAS E ESTRATÉGIAS (10 min)
   - REGRA: Meta deve ser SMART (Específica, Mensurável, Alcançável, Relevante, Temporal)
   - DINÂMICA: Cada vendedor faz compromisso público de sua meta individual
   - VISUAL: Meta total na tela, dividida por semana
   - ESTRATÉGIAS: Máximo 3 estratégias focadas, não uma lista genérica
   - OWNERSHIP: Cada estratégia deve ter um "dono" responsável

6. ENCERRAMENTO (5 min)
   - REGRA: NUNCA termine em baixa energia - termine no AUGE
   - DINÂMICA: Grito de guerra da equipe / Palavra de ordem coletiva
   - COMPROMISSO: Todos em pé, mãos dadas ou empilhadas no centro
   - FECHAMENTO: Frase de impacto que resuma o tema do mês
   - PÓS-RMR: Foto do time para o grupo de WhatsApp

=== INSTRUÇÕES PARA O ROTEIRO ===

Gere um roteiro COMPLETO em Markdown seguindo EXATAMENTE esta estrutura:

1. Para cada seção, inclua:
   - Tempo exato (ex: "00:00 - 05:00")
   - Objetivo da seção
   - Fala roteirizada entre aspas com indicações de entonação [ÊNFASE], [PAUSA], [BAIXAR TOM]
   - Dinâmica específica a ser aplicada
   - Checklist de materiais necessários
   - Transição para próxima seção

2. Use os dados REAIS fornecidos nas falas (nomes, valores, porcentagens)

3. Para o RECONHECIMENTO do destaque ${rmrData.highlight.name}:
   - Crie uma narrativa épica de 2-3 minutos
   - Inclua: de onde ele veio, obstáculos superados, impacto na equipe
   - Termine com "Este é o nosso campeão de ${monthName}!"

4. Para o VÍDEO ${rmrData.video ? `"${rmrData.video.title}"` : "(não selecionado)"}:
   - Crie uma introdução de 1 minuto conectando ao tema "${rmrData.theme}"
   - Crie perguntas reflexivas pós-vídeo
   - Conecte a mensagem com as estratégias do próximo mês

5. Para as METAS:
   - Divida ${formatCurrency(rmrData.goal)} em metas semanais
   - Crie uma dinâmica de compromisso público
   - Relacione cada estratégia com ações concretas

IMPORTANTE: 
- ESCREVA SEMPRE COM ACENTUAÇÃO CORRETA EM PORTUGUÊS BRASILEIRO
- Use: á, à, ã, â, é, ê, í, ó, ô, õ, ú, ç
- NÃO use emojis ou caracteres especiais Unicode
- Use apenas caracteres ASCII simples e acentos portugueses
- Escreva de forma clara e objetiva
- Cada fala deve ser prática e aplicável
- Inclua indicações de tom de voz e gestos

Comece o roteiro agora:`;

    console.log("Generating RMR script with enhanced prompt...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `Você é um consultor de gestão comercial com 20 anos de experiência. Você é especialista em conduzir reuniões de metas que transformam equipes de vendas. Seu estilo é enérgico, positivo e orientado a resultados. Você conhece profundamente a metodologia RMR (Reunião de Metas e Reconhecimento) e sabe como criar momentos memoráveis que motivam equipes.

REGRAS IMPORTANTES:
- ESCREVA SEMPRE COM ACENTUAÇÃO CORRETA EM PORTUGUÊS BRASILEIRO
- Use acentos: á, à, ã, â, é, ê, í, ó, ô, õ, ú e cedilha: ç
- Exemplos: reunião, você, é, não, gestão, ação, próximo, estratégia
- NÃO use emojis ou caracteres Unicode especiais
- Use formatação Markdown limpa
- Crie falas roteirizadas práticas e aplicáveis
- Inclua dinâmicas de grupo específicas
- Foque em criar energia e motivação` 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const scriptMarkdown = data.choices?.[0]?.message?.content || "";

    console.log("Script generated successfully, length:", scriptMarkdown.length);

    // Parse sections from markdown
    const sections = [];
    const sectionHeaders = [
      { title: "Abertura", duration: 5 },
      { title: "Resultados do Mês", duration: 10 },
      { title: "Reconhecimento", duration: 5 },
      { title: "Momento Motivacional", duration: 10 },
      { title: "Metas e Estratégias", duration: 10 },
      { title: "Encerramento", duration: 5 },
    ];

    for (const section of sectionHeaders) {
      const regex = new RegExp(`##?\\s*\\d*\\.?\\s*${section.title}[^#]*`, "i");
      const match = scriptMarkdown.match(regex);
      sections.push({
        title: section.title,
        duration_minutes: section.duration,
        content: match ? match[0].trim() : "",
      });
    }

    return new Response(
      JSON.stringify({
        script_markdown: scriptMarkdown,
        sections,
        total_duration_minutes: 45,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating RMR script:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
