import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface YouTubeSearchSuggestion {
  id: string;
  search_query: string;
  search_url: string;
  description: string;
  suggested_channels: string[];
  estimated_results_type: string;
}

export const useYouTubeSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<YouTubeSearchSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateSearchSuggestions = useCallback(async (
    theme: string,
    context?: string
  ): Promise<YouTubeSearchSuggestion[]> => {
    if (!theme) return [];

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-youtube-search', {
        body: { theme, context, language: 'pt-BR' }
      });

      if (fnError) throw fnError;

      const newSuggestions = data.suggestions as YouTubeSearchSuggestion[];
      setSuggestions(newSuggestions);
      
      return newSuggestions;

    } catch (err) {
      console.error('Error generating search suggestions:', err);
      const message = err instanceof Error ? err.message : 'Erro ao gerar sugestões de busca';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSearch = useCallback((searchUrl: string) => {
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSearchSuggestions,
    openSearch,
    clearSuggestions
  };
};
