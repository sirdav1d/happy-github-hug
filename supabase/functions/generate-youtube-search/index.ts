import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  theme: string;
  context?: string;
  language?: string;
}

interface SearchSuggestion {
  id: string;
  search_query: string;
  search_url: string;
  description: string;
  suggested_channels: string[];
  estimated_results_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, context, language = 'pt-BR' }: SearchRequest = await req.json();

    console.log('Generating YouTube search suggestions for theme:', theme);

    if (!theme) {
      return new Response(
        JSON.stringify({ error: 'Theme is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let suggestions: SearchSuggestion[] = [];
    let aiSuccess = false;

    // Try AI if API key is available
    if (LOVABLE_API_KEY) {
      const prompt = `Você é um especialista em vídeos motivacionais para equipes de vendas no Brasil.

TEMA DA RMR (Reunião de Metas e Reconhecimento): "${theme}"
${context ? `CONTEXTO ADICIONAL: ${context}` : ''}
IDIOMA: ${language}

TAREFA: Gere 5 sugestões de busca otimizadas para encontrar vídeos motivacionais no YouTube.

Para cada sugestão, inclua:
1. Termo de busca otimizado (palavras-chave que funcionam bem no YouTube)
2. Descrição do tipo de conteúdo esperado
3. Canais brasileiros recomendados para esse tipo de conteúdo
4. Tipo de resultado esperado (palestra, entrevista, animação, etc.)

Responda APENAS com JSON válido no formato:
{
  "suggestions": [
    {
      "search_query": "termo de busca otimizado",
      "description": "Descrição do que essa busca deve retornar",
      "suggested_channels": ["Canal 1", "Canal 2"],
      "estimated_results_type": "palestra motivacional"
    }
  ]
}

REGRAS:
1. Foque em conteúdo em português brasileiro
2. Priorize termos que encontrem vídeos de 3-10 minutos
3. Inclua canais conhecidos como: Flávio Augusto, Geraldo Rufino, Joel Jota, Mario Sergio Cortella, Leandro Karnal
4. Evite termos muito genéricos
5. Considere o tema específico da RMR para sugestões precisas`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          try {
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanContent);
            
            suggestions = (parsed.suggestions || []).map((s: any, index: number) => ({
              id: `search-${index + 1}`,
              search_query: s.search_query,
              search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(s.search_query)}`,
              description: s.description,
              suggested_channels: s.suggested_channels || [],
              estimated_results_type: s.estimated_results_type || 'vídeo motivacional'
            }));
            aiSuccess = suggestions.length > 0;
            console.log('AI generated', suggestions.length, 'suggestions successfully');
          } catch (parseError) {
            console.log('Failed to parse AI response, using fallback');
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('AI Gateway error:', aiResponse.status, errorText);
          // Don't throw - let it fall through to fallback
        }
      } catch (aiError) {
        console.error('AI Gateway request failed:', aiError);
        // Don't throw - let it fall through to fallback
      }
    } else {
      console.log('LOVABLE_API_KEY not configured, using fallback');
    }

    // Fallback: generate suggestions based on theme keywords
    if (!aiSuccess) {
      console.log('Using fallback suggestions for theme:', theme);
      
      // Extract meaningful keywords from theme
      const themeClean = theme.replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/gi, '').trim();
      const words = themeClean.split(/\s+/).filter(w => w.length > 3);
      const keywords = words.slice(0, 3).join(' ');
      
      const channels = ['Flávio Augusto', 'Joel Jota', 'Mario Sergio Cortella', 'Leandro Karnal', 'Geraldo Rufino'];
      
      const fallbackTemplates = [
        { 
          query: `${keywords} motivação vendas`, 
          desc: 'Vídeos motivacionais focados em vendas e resultados', 
          type: 'motivacional',
          channels: ['Flávio Augusto', 'Joel Jota']
        },
        { 
          query: `palestra ${keywords} equipe`, 
          desc: 'Palestras inspiradoras sobre trabalho em equipe', 
          type: 'palestra',
          channels: ['Mario Sergio Cortella', 'Leandro Karnal']
        },
        { 
          query: `${keywords} liderança comercial`, 
          desc: 'Conteúdo sobre liderança e gestão de times comerciais', 
          type: 'liderança',
          channels: ['Joel Jota', 'Flávio Augusto']
        },
        { 
          query: `${keywords} sucesso negócios curto`, 
          desc: 'Histórias de sucesso e inspiração rápidas', 
          type: 'inspiracional',
          channels: ['Geraldo Rufino', 'Joel Jota']
        },
        { 
          query: `dicas ${keywords} superação`, 
          desc: 'Dicas práticas e cases de superação', 
          type: 'dicas',
          channels: ['Leandro Karnal', 'Mario Sergio Cortella']
        },
      ];

      suggestions = fallbackTemplates.map((template, index) => ({
        id: `search-${index + 1}`,
        search_query: template.query,
        search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(template.query)}`,
        description: template.desc,
        suggested_channels: template.channels,
        estimated_results_type: template.type
      }));
    }

    console.log(`Generated ${suggestions.length} search suggestions`);

    return new Response(
      JSON.stringify({ 
        suggestions,
        theme,
        generated_at: new Date().toISOString(),
        ai_generated: aiSuccess
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-youtube-search:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
