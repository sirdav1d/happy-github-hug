import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoSuggestionRequest {
  theme: string;
  context?: string;
  language?: string;
  maxDurationMinutes?: number;
  categories?: string[];
}

interface Video {
  id: string;
  youtube_url: string;
  youtube_id: string;
  title: string;
  channel_name: string;
  duration_seconds: number;
  thumbnail_url: string;
  categories: string[];
  keywords: string[];
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, context, language = 'pt-BR', maxDurationMinutes = 15, categories }: VideoSuggestionRequest = await req.json();

    console.log('Suggesting videos for theme:', theme);

    if (!theme) {
      return new Response(
        JSON.stringify({ error: 'Theme is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch videos from library
    let query = supabase
      .from('video_library')
      .select('*')
      .eq('is_active', true)
      .eq('language', language);

    if (maxDurationMinutes) {
      query = query.lte('duration_seconds', maxDurationMinutes * 60);
    }

    const { data: videos, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to fetch videos from library');
    }

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: 'No videos found in library' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${videos.length} videos in library`);

    // Filter by categories if provided
    let filteredVideos = videos;
    if (categories && categories.length > 0) {
      filteredVideos = videos.filter((video: Video) => 
        video.categories?.some(cat => categories.includes(cat))
      );
      // If no videos match categories, fall back to all videos
      if (filteredVideos.length === 0) {
        filteredVideos = videos;
      }
    }

    // Build prompt for AI ranking
    const videosList = filteredVideos.map((v: Video, i: number) => 
      `${i + 1}. "${v.title}" (${v.channel_name}) - Categorias: ${v.categories?.join(', ')} - Descrição: ${v.description || 'N/A'}`
    ).join('\n');

    const prompt = `Você é um especialista em desenvolvimento de equipes de vendas. 
    
TEMA DA RMR: "${theme}"
${context ? `CONTEXTO: ${context}` : ''}

VÍDEOS DISPONÍVEIS:
${videosList}

TAREFA: Ranqueie os 5 vídeos mais relevantes para este tema de RMR. Para cada vídeo, explique brevemente (1 frase) por que ele é adequado.

Responda APENAS com JSON no formato:
{
  "rankings": [
    {"index": 1, "relevance_score": 95, "reason": "Motivo conciso"},
    {"index": 3, "relevance_score": 88, "reason": "Motivo conciso"}
  ]
}

REGRAS:
1. "index" é o número do vídeo na lista (1-indexed)
2. "relevance_score" de 0 a 100
3. Retorne no máximo 5 vídeos
4. Priorize vídeos que conectam diretamente com o tema
5. Considere duração (vídeos mais curtos para abertura, mais longos para reflexão)`;

    // Call Lovable AI
    const geminiResponse = await fetch(`${supabaseUrl}/functions/v1/proxy-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });

    let rankings: { index: number; relevance_score: number; reason: string }[] = [];

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      try {
        const content = geminiData.choices?.[0]?.message?.content || geminiData.content || '';
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        rankings = parsed.rankings || [];
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }

    // If AI ranking failed, use keyword matching as fallback
    if (rankings.length === 0) {
      const themeWords = theme.toLowerCase().split(/\s+/);
      const scored = filteredVideos.map((video: Video) => {
        let score = 0;
        const videoText = `${video.title} ${video.description} ${video.keywords?.join(' ')} ${video.categories?.join(' ')}`.toLowerCase();
        
        themeWords.forEach(word => {
          if (videoText.includes(word)) score += 20;
        });
        
        return { video, score };
      });

      scored.sort((a, b) => b.score - a.score);
      
      rankings = scored.slice(0, 5).map((item, index) => ({
        index: filteredVideos.indexOf(item.video) + 1,
        relevance_score: Math.max(60, 95 - (index * 8)),
        reason: `Vídeo relevante para o tema "${theme.slice(0, 30)}..."`
      }));
    }

    // Build final suggestions with full video data
    const suggestions = rankings.map(rank => {
      const video = filteredVideos[rank.index - 1];
      if (!video) return null;
      
      const durationMinutes = Math.floor(video.duration_seconds / 60);
      const durationSeconds = video.duration_seconds % 60;
      
      return {
        video_id: video.id,
        youtube_id: video.youtube_id,
        youtube_url: video.youtube_url,
        title: video.title,
        channel_name: video.channel_name,
        thumbnail_url: video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`,
        duration_formatted: `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`,
        duration_seconds: video.duration_seconds,
        categories: video.categories,
        relevance_score: rank.relevance_score,
        ai_reason: rank.reason
      };
    }).filter(Boolean);

    console.log(`Returning ${suggestions.length} video suggestions`);

    return new Response(
      JSON.stringify({ 
        suggestions,
        total_in_library: videos.length,
        filtered_count: filteredVideos.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in suggest-rmr-videos:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
