/**
 * Utilitários para parsing e manipulação de URLs do YouTube
 */

export interface YouTubeVideoData {
  youtubeId: string;
  youtubeUrl: string;
  thumbnailUrl: string;
}

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 * Suporta formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    // Standard watch URL
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^&\s]+)/,
    // Short URL
    /youtu\.be\/([^?\s]+)/,
    // Embed URL
    /youtube\.com\/embed\/([^?\s]+)/,
    // V URL
    /youtube\.com\/v\/([^?\s]+)/,
    // Shorts URL
    /youtube\.com\/shorts\/([^?\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Gera a URL normalizada do YouTube a partir do ID
 */
export function generateYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Gera a URL da thumbnail do YouTube
 * @param videoId - ID do vídeo
 * @param quality - Qualidade da thumbnail: 'default', 'medium', 'high', 'standard', 'maxres'
 */
export function generateThumbnailUrl(
  videoId: string, 
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Parseia uma URL do YouTube e retorna os dados estruturados
 */
export function parseYouTubeUrl(url: string): YouTubeVideoData | null {
  const youtubeId = extractYouTubeId(url);
  
  if (!youtubeId) {
    return null;
  }
  
  return {
    youtubeId,
    youtubeUrl: generateYouTubeUrl(youtubeId),
    thumbnailUrl: generateThumbnailUrl(youtubeId),
  };
}

/**
 * Valida se uma string é uma URL válida do YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Formata duração em segundos para string legível (mm:ss ou hh:mm:ss)
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Converte duração string (mm:ss ou hh:mm:ss) para segundos
 */
export function parseDuration(duration: string): number | null {
  if (!duration) return null;
  
  const parts = duration.split(':').map(p => parseInt(p, 10));
  
  if (parts.some(isNaN)) return null;
  
  if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return null;
}

/**
 * Lista de categorias disponíveis para vídeos
 */
export const VIDEO_CATEGORIES = [
  'Motivação',
  'Liderança',
  'Vendas',
  'Superação',
  'Trabalho em Equipe',
  'Metas',
  'Reconhecimento',
  'Atendimento',
  'Produtividade',
  'Mindset',
] as const;

export type VideoCategory = typeof VIDEO_CATEGORIES[number];
