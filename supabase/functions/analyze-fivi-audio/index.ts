import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FIVIContext {
  salesperson_name: string;
  weekly_goal: number;
  weekly_realized: number;
  previous_sessions?: Array<{
    week_number: number;
    ai_summary?: string;
    ai_confidence_score?: number;
    ai_commitments?: string[];
    weekly_commitment: number;
    weekly_realized: number;
  }>;
}

interface AIAnalysisResult {
  transcription: string;
  summary: string;
  sentiment: {
    overall: 'confiante' | 'neutro' | 'inseguro' | 'frustrado' | 'entusiasmado';
    score: number;
    indicators: Array<{
      type: string;
      evidence: string;
      weight: number;
    }>;
    evolutionVsPrevious?: 'melhora' | 'estável' | 'declínio';
  };
  commitments: string[];
  concerns: string[];
  confidenceScore: number;
  keyPoints: {
    conquistas: string[];
    desafios: string[];
    oportunidades: string[];
    acoes_sugeridas: string[];
  };
  transcriptionWarning?: string;
}

// Patterns that indicate possible hallucination
const SUSPICIOUS_PATTERNS = [
  'Dr. Alexandre',
  'Instituto Amato',
  'cirurgião vascular',
  'clínica médica',
  'procedimento cirúrgico',
  'hospital',
  'paciente',
  'diagnóstico',
  'tratamento médico',
];

function checkForHallucination(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SUSPICIOUS_PATTERNS.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

function validateTranscription(transcription: string): { valid: boolean; warning?: string } {
  // Check for empty or too short
  if (!transcription || transcription.trim().length < 10) {
    return { 
      valid: false, 
      warning: 'Transcrição muito curta ou vazia. O áudio pode estar com problemas de qualidade.' 
    };
  }

  // Check for [INAUDÍVEL] or similar markers
  if (transcription.includes('[INAUDÍVEL]') || transcription.includes('[SEM CONTEÚDO]')) {
    return { 
      valid: true, 
      warning: 'O áudio não contém fala clara. A transcrição pode estar incompleta.' 
    };
  }

  // Check for hallucination patterns
  if (checkForHallucination(transcription)) {
    return { 
      valid: false, 
      warning: 'A transcrição parece conter conteúdo não relacionado à reunião. Por favor, verifique a qualidade do áudio e tente novamente.' 
    };
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { audioFilePath, salespersonId, context } = await req.json() as {
      audioFilePath: string;
      salespersonId: string;
      context: FIVIContext;
    };

    console.log('Processing FIVI audio analysis for:', context.salesperson_name);

    // Get signed URL for the audio file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('fivi-recordings')
      .createSignedUrl(audioFilePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error getting signed URL:', signedUrlError);
      throw new Error('Failed to get audio file URL');
    }

    // Fetch audio file as base64
    const audioResponse = await fetch(signedUrlData.signedUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Convert to base64 safely (chunked to avoid stack overflow)
    const uint8Array = new Uint8Array(audioBuffer);
    const chunkSize = 32768; // 32KB chunks
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Audio = btoa(binaryString);

    // Determine audio MIME type from file extension
    const extension = audioFilePath.split('.').pop()?.toLowerCase();
    let mimeType = 'audio/mpeg';
    if (extension === 'wav') mimeType = 'audio/wav';
    else if (extension === 'm4a') mimeType = 'audio/mp4';
    else if (extension === 'webm') mimeType = 'audio/webm';

    console.log('Calling Lovable AI for transcription with optimized prompt...');

    // Step 1: Transcribe the audio with ULTRA-STRICT prompt
    // Using gemini-2.5-pro for better accuracy
    const transcriptionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Você é um transcritor profissional EXTREMAMENTE LITERAL.

REGRAS ABSOLUTAS:
1. Transcreva EXATAMENTE o que você ouve no áudio, palavra por palavra
2. NÃO invente, complete ou adicione NADA que não foi dito
3. NÃO corrija erros de fala - transcreva exatamente como foi falado
4. Se não conseguir ouvir ou entender uma palavra, escreva [INAUDÍVEL]
5. Se o áudio estiver em silêncio ou sem fala, retorne: [SEM CONTEÚDO AUDÍVEL]
6. Se houver ruído que impede a compreensão, retorne: [ÁUDIO COM RUÍDO]
7. NUNCA crie diálogos fictícios ou conteúdo imaginário
8. Transcreva em português brasileiro
9. Se o áudio for muito curto (menos de 3 segundos), retorne: [ÁUDIO MUITO CURTO]

IMPORTANTE: É MELHOR retornar [INAUDÍVEL] do que inventar conteúdo!` 
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcreva este áudio de forma LITERAL. Se não conseguir ouvir claramente, use [INAUDÍVEL]. NUNCA invente conteúdo.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Audio,
                  format: mimeType.split('/')[1]
                }
              }
            ]
          }
        ],
      }),
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Lovable AI transcription error:', transcriptionResponse.status, errorText);
      
      if (transcriptionResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (transcriptionResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes. Adicione créditos ao workspace Lovable.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcription = transcriptionData.choices?.[0]?.message?.content?.trim();

    if (!transcription) {
      console.error('No transcription in AI response:', transcriptionData);
      throw new Error('Failed to transcribe audio');
    }

    console.log('Transcription received:', transcription.substring(0, 200) + '...');

    // Validate transcription for hallucinations or issues
    const validation = validateTranscription(transcription);
    
    if (!validation.valid) {
      console.warn('Transcription validation failed:', validation.warning);
      return new Response(JSON.stringify({
        success: false,
        error: validation.warning,
        transcriptionWarning: validation.warning,
        analysis: {
          transcription: transcription,
          summary: 'Não foi possível analisar: ' + validation.warning,
          sentiment: { overall: 'neutro', score: 50, indicators: [] },
          commitments: [],
          concerns: [],
          confidenceScore: 0,
          keyPoints: {
            conquistas: [],
            desafios: [],
            oportunidades: [],
            acoes_sugeridas: ['Verifique a qualidade do áudio e tente gravar novamente']
          },
          transcriptionWarning: validation.warning
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if transcription indicates no content
    const noContentMarkers = ['[SEM CONTEÚDO', '[ÁUDIO COM RUÍDO]', '[ÁUDIO MUITO CURTO]', '[INAUDÍVEL]'];
    const hasNoContent = noContentMarkers.some(marker => transcription.includes(marker) && transcription.length < 100);
    
    if (hasNoContent) {
      console.log('Audio has no clear content, returning minimal analysis');
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          transcription: transcription,
          summary: 'O áudio não contém conteúdo de fala claro para análise.',
          sentiment: { overall: 'neutro', score: 50, indicators: [] },
          commitments: [],
          concerns: [],
          confidenceScore: 0,
          keyPoints: {
            conquistas: [],
            desafios: [],
            oportunidades: [],
            acoes_sugeridas: ['Grave novamente com áudio mais claro']
          },
          transcriptionWarning: validation.warning
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Transcription valid, analyzing content...');

    // Build context for the AI
    const previousSessionsSummary = context.previous_sessions?.map(s => 
      `Semana ${s.week_number}: Score ${s.ai_confidence_score ?? 'N/A'}, Compromisso: R$${s.weekly_commitment}, Entregue: R$${s.weekly_realized}`
    ).join('\n') || 'Nenhuma sessão anterior';

    // Step 2: Analyze the transcription with CONSERVATIVE prompt
    const analysisPrompt = `Você é um analista de vendas conservador. Analise APENAS o que está escrito na transcrição abaixo.

REGRAS CRÍTICAS:
1. Baseie sua análise EXCLUSIVAMENTE na transcrição fornecida
2. NÃO invente informações que não estão presentes
3. Se a transcrição for curta, faça uma análise proporcional e breve
4. Se não houver compromissos EXPLÍCITOS mencionados, retorne array vazio: "commitments": []
5. Se não houver preocupações CLARAS, retorne array vazio: "concerns": []
6. Se não conseguir identificar sentimento claro, use "neutro" com score 50
7. NÃO crie cenários hipotéticos ou suposições
8. Seja breve e objetivo

TRANSCRIÇÃO (analise SOMENTE isto):
"${transcription}"

CONTEXTO DO VENDEDOR (use apenas para referência, não invente baseado nisto):
- Nome: ${context.salesperson_name}
- Meta semanal: R$ ${context.weekly_goal.toLocaleString('pt-BR')}
- Realizado até agora: R$ ${context.weekly_realized.toLocaleString('pt-BR')}

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
{
  "summary": "resumo de 1-3 linhas baseado APENAS na transcrição",
  "sentiment": {
    "overall": "confiante" ou "neutro" ou "inseguro" ou "frustrado" ou "entusiasmado",
    "score": número de 0 a 100,
    "indicators": [
      {"type": "tipo", "evidence": "trecho EXATO da transcrição", "weight": número de 0.0 a 1.0}
    ]
  },
  "commitments": ["compromisso mencionado EXPLICITAMENTE"],
  "concerns": ["preocupação mencionada EXPLICITAMENTE"],
  "confidenceScore": número de 0 a 100,
  "keyPoints": {
    "conquistas": ["mencionada na transcrição"],
    "desafios": ["mencionado na transcrição"],
    "oportunidades": ["mencionada na transcrição"],
    "acoes_sugeridas": ["baseada no que foi dito"]
  }
}`;

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um analista conservador. Responda APENAS com JSON válido. NÃO invente dados que não estão na transcrição.'
          },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Lovable AI analysis error:', analysisResponse.status, errorText);
      throw new Error(`AI analysis gateway error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const rawContent = analysisData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error('No content in AI analysis response:', analysisData);
      throw new Error('AI did not return analysis');
    }

    console.log('Analysis response received, parsing...');

    // Parse the JSON response
    let parsedAnalysis;
    try {
      // Clean up potential markdown formatting
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      parsedAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI analysis response:', rawContent);
      // Fallback: create minimal analysis with just the transcription
      parsedAnalysis = {
        summary: 'Análise automática não disponível. Revise a transcrição manualmente.',
        sentiment: {
          overall: 'neutro',
          score: 50,
          indicators: []
        },
        commitments: [],
        concerns: [],
        confidenceScore: 50,
        keyPoints: {
          conquistas: [],
          desafios: [],
          oportunidades: [],
          acoes_sugeridas: []
        }
      };
    }

    // Build the complete analysis object
    const analysis: AIAnalysisResult = {
      transcription,
      summary: parsedAnalysis.summary || 'Resumo não disponível',
      sentiment: parsedAnalysis.sentiment || { overall: 'neutro', score: 50, indicators: [] },
      commitments: parsedAnalysis.commitments || [],
      concerns: parsedAnalysis.concerns || [],
      confidenceScore: parsedAnalysis.confidenceScore || parsedAnalysis.sentiment?.score || 50,
      keyPoints: parsedAnalysis.keyPoints || {
        conquistas: [],
        desafios: [],
        oportunidades: [],
        acoes_sugeridas: []
      },
      transcriptionWarning: validation.warning
    };

    console.log('Analysis complete. Confidence score:', analysis.confidenceScore);

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-fivi-audio:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
