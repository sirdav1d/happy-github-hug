import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, salespersonName, salespersonId, manualTranscription } = await req.json();

    if (!audioBase64 && !manualTranscription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Áudio ou transcrição não fornecidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de IA não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing behavioral audio analysis for: ${salespersonName}`);

    let transcription = manualTranscription || '';
    
    // If audio was provided, we need to handle transcription differently
    // Since Lovable AI doesn't support direct audio input, we'll inform the user
    if (audioBase64 && !manualTranscription) {
      // For now, return an error asking user to provide manual transcription
      // In future, we could integrate with a speech-to-text service
      console.log('Audio received but manual transcription not provided');
      
      // Try to use Gemini with inline_data format for audio
      try {
        const transcriptionResponse = await fetch(AI_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Transcreva o áudio abaixo de forma precisa e literal. Se não conseguir, responda "ERRO_TRANSCRICAO: [motivo]".`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:audio/webm;base64,${audioBase64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 4000,
            temperature: 0.1,
          }),
        });

        if (transcriptionResponse.ok) {
          const transcriptionData = await transcriptionResponse.json();
          transcription = transcriptionData.choices?.[0]?.message?.content || '';
          console.log('Transcription from audio:', transcription.substring(0, 100));
          
          if (transcription.startsWith('ERRO_TRANSCRICAO:') || !transcription || transcription.length < 50) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Não foi possível transcrever o áudio automaticamente. Por favor, use a opção de transcrição manual.',
                requireManualTranscription: true
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          console.error('Transcription API error:', transcriptionResponse.status);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Erro ao transcrever áudio. Tente a opção de transcrição manual.',
              requireManualTranscription: true
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (transcError) {
        console.error('Transcription error:', transcError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Transcrição automática não disponível. Use a opção manual.',
            requireManualTranscription: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!transcription || transcription.length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Transcrição muito curta ou vazia. Forneça mais conteúdo para análise.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcription length:', transcription.length);

    // Step 2: Analyze transcription for DISC and Values
    const analysisPrompt = `Analise a transcrição abaixo de uma conversa com ${salespersonName} e extraia o perfil comportamental DISC e motivadores (Values).

TRANSCRIÇÃO:
${transcription}

INSTRUÇÕES DE ANÁLISE:

1. DISC - Avalie de 0-100 cada dimensão baseado em:
- D (Dominância): Assertividade, foco em resultados, tomada de decisão rápida, competitividade
- I (Influência): Sociabilidade, otimismo, persuasão, entusiasmo, comunicação
- S (Estabilidade): Paciência, consistência, lealdade, trabalho em equipe, resistência à mudança
- C (Conformidade): Precisão, atenção a detalhes, análise, qualidade, seguir regras

2. VALUES (opcional) - Se houver evidências claras, avalie de 0-100:
- Estético: Valoriza harmonia, beleza, experiências
- Econômico: Foco em retorno, praticidade, recursos
- Individualista: Busca destaque, unicidade, liderança
- Político: Poder, influência, controle
- Altruísta: Ajudar outros, servir, impacto social
- Regulador: Ordem, tradição, estrutura
- Teórico: Conhecimento, aprendizado, verdade

3. ANÁLISE - Baseie-se APENAS no que foi dito na transcrição. Não invente.

Responda EXATAMENTE neste formato JSON:
{
  "discScores": {
    "d": [número 0-100],
    "i": [número 0-100],
    "s": [número 0-100],
    "c": [número 0-100]
  },
  "valuesScores": {
    "aesthetic": [número ou null],
    "economic": [número ou null],
    "individualist": [número ou null],
    "political": [número ou null],
    "altruistic": [número ou null],
    "regulatory": [número ou null],
    "theoretical": [número ou null]
  },
  "aiSummary": "[Resumo de 2-3 parágrafos sobre o perfil comportamental observado, pontos fortes e áreas de desenvolvimento]",
  "confidence": [número 0-100 indicando sua confiança na análise]
}`;

    const analysisResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'Você é um psicólogo organizacional especialista em análise comportamental DISC e motivadores Values. Analise conversas e extraia perfis comportamentais com precisão.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Analysis error:', analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de uso excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na análise comportamental' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices?.[0]?.message?.content || '';

    console.log('Analysis completed');

    // Parse JSON from response
    let result;
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing analysis result:', parseError);
      console.error('Raw response:', analysisText);
      
      // Return a default result if parsing fails
      result = {
        discScores: { d: 50, i: 50, s: 50, c: 50 },
        valuesScores: null,
        aiSummary: 'Não foi possível processar a análise completa. Por favor, revise os dados manualmente.',
        confidence: 30
      };
    }

    // Clean up values scores (remove nulls)
    let cleanedValuesScores = null;
    if (result.valuesScores) {
      const hasAnyValue = Object.values(result.valuesScores).some(v => v !== null && v !== undefined);
      if (hasAnyValue) {
        cleanedValuesScores = {
          aesthetic: result.valuesScores.aesthetic ?? 50,
          economic: result.valuesScores.economic ?? 50,
          individualist: result.valuesScores.individualist ?? 50,
          political: result.valuesScores.political ?? 50,
          altruistic: result.valuesScores.altruistic ?? 50,
          regulatory: result.valuesScores.regulatory ?? 50,
          theoretical: result.valuesScores.theoretical ?? 50,
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcription,
        discScores: result.discScores,
        valuesScores: cleanedValuesScores,
        aiSummary: result.aiSummary,
        confidence: result.confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-behavioral-audio:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});