import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gamma-api-key',
};

interface TeamMember {
  id: string;
  name: string;
  revenue: number;
  goal: number;
}

interface RMRData {
  month: number;
  year: number;
  theme: string;
  highlight: {
    name: string;
    reason: string;
  };
  previousMonth: {
    revenue: number;
    goal: number;
  };
  goal: number;
  strategies: string[];
  video?: {
    title: string;
    url: string;
  };
  team: TeamMember[];
  companyName?: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function generateInputText(data: RMRData): string {
  const monthName = MONTHS[data.month - 1];
  const percentAchieved = data.previousMonth.goal > 0 
    ? ((data.previousMonth.revenue / data.previousMonth.goal) * 100).toFixed(1)
    : "0";
  
  const topPerformers = [...data.team]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  let text = `# RMR - Reunião de Metas e Reconhecimento
## ${data.companyName || "Empresa"}
## ${monthName} ${data.year}

---

# Resultados do Mês Anterior

| Métrica | Valor |
|---------|-------|
| **Meta** | ${formatCurrency(data.previousMonth.goal)} |
| **Realizado** | ${formatCurrency(data.previousMonth.revenue)} |
| **Atingimento** | ${percentAchieved}% |

---

# Top 5 Vendedores 🏆

`;

  topPerformers.forEach((performer, idx) => {
    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
    text += `${medal} **${performer.name}** - ${formatCurrency(performer.revenue)}\n`;
  });

  if (data.highlight?.name) {
    text += `
---

# Destaque do Mês ⭐

**${data.highlight.name}**

${data.highlight.reason || "Reconhecimento especial por sua dedicação e resultados excepcionais."}

`;
  }

  if (data.video?.title) {
    text += `
---

# Vídeo Motivacional 🎬

**${data.video.title}**

[Clique para assistir](${data.video.url})

`;
  }

  text += `
---

# Meta do Próximo Mês

## ${formatCurrency(data.goal)}

`;

  if (data.strategies && data.strategies.length > 0) {
    text += `### Estratégias:\n`;
    data.strategies.forEach((strategy, idx) => {
      text += `${idx + 1}. ${strategy}\n`;
    });
  }

  if (data.theme) {
    text += `
---

# Tema do Mês

> "${data.theme}"

`;
  }

  text += `
---

# Juntos Somos Mais Fortes! 💪

Vamos conquistar nossos objetivos com dedicação, foco e trabalho em equipe.

**${data.companyName || "Time de Vendas"}**
`;

  return text;
}

async function createGammaGeneration(apiKey: string, inputText: string): Promise<string> {
  console.log("[Gamma] Starting generation...");
  
  const response = await fetch("https://api.gamma.app/v1/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputText,
      format: "presentation",
      numCards: 6,
      textMode: "generate",
      imageOptions: {
        source: "unsplash"
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Gamma] Error creating generation:", errorText);
    throw new Error(`Gamma API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("[Gamma] Generation created:", data.id);
  return data.id;
}

async function pollGenerationStatus(apiKey: string, generationId: string, maxAttempts = 60): Promise<{
  status: string;
  gammaUrl?: string;
  pptxUrl?: string;
}> {
  console.log("[Gamma] Polling status for generation:", generationId);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://api.gamma.app/v1/generations/${generationId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gamma] Error checking status:", errorText);
      throw new Error(`Gamma API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Gamma] Status (attempt ${attempt + 1}):`, data.status);

    if (data.status === "completed") {
      return {
        status: "completed",
        gammaUrl: data.url || data.gammaUrl,
        pptxUrl: data.pptxUrl || data.exportUrl,
      };
    }

    if (data.status === "failed") {
      throw new Error("Gamma generation failed: " + (data.error || "Unknown error"));
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error("Gamma generation timed out after " + (maxAttempts * 2) + " seconds");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gammaApiKey = req.headers.get("x-gamma-api-key");
    
    if (!gammaApiKey) {
      console.error("[Gamma] No API key provided");
      return new Response(
        JSON.stringify({ error: "Gamma API key is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { rmrData } = await req.json() as { rmrData: RMRData };
    
    if (!rmrData) {
      console.error("[Gamma] No RMR data provided");
      return new Response(
        JSON.stringify({ error: "RMR data is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("[Gamma] Generating slides for:", {
      month: rmrData.month,
      year: rmrData.year,
      company: rmrData.companyName
    });

    // Generate the input text for Gamma
    const inputText = generateInputText(rmrData);
    console.log("[Gamma] Input text length:", inputText.length);

    // Create the generation
    const generationId = await createGammaGeneration(gammaApiKey, inputText);

    // Poll for completion
    const result = await pollGenerationStatus(gammaApiKey, generationId);

    console.log("[Gamma] Generation completed:", result);

    return new Response(
      JSON.stringify({
        success: true,
        generationId,
        gammaUrl: result.gammaUrl,
        pptxUrl: result.pptxUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[Gamma] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
