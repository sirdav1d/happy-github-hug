import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VideoSuggestion {
  video_id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  duration_formatted: string;
  duration_seconds: number;
  categories: string[];
  relevance_score: number;
  ai_reason: string;
}

export interface VideoLibraryItem {
  id: string;
  youtube_url: string;
  youtube_id: string;
  title: string;
  channel_name: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  categories: string[];
  keywords: string[];
  description: string | null;
  language: string;
  is_active: boolean;
  times_used: number;
  average_rating: number | null;
}

export interface RMRVideoSuggestion {
  id: string;
  rmr_id: string | null;
  user_id: string;
  video_id: string | null;
  youtube_url: string;
  youtube_id: string;
  title: string;
  suggested_by_ai: boolean;
  user_rating: number | null;
  was_used: boolean;
  notes: string | null;
  created_at: string;
}

export const useVideoSuggestions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);

  // Fetch all videos from library
  const { data: videoLibrary = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['video-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_library')
        .select('*')
        .eq('is_active', true)
        .order('times_used', { ascending: false });

      if (error) throw error;
      return data as VideoLibraryItem[];
    },
  });

  // Fetch user's video history for RMRs
  const { data: videoHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['rmr-video-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('rmr_video_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('was_used', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RMRVideoSuggestion[];
    },
    enabled: !!user?.id,
  });

  // Get AI suggestions based on theme
  const fetchSuggestions = useCallback(async (
    theme: string,
    context?: string,
    categories?: string[],
    maxDurationMinutes?: number
  ): Promise<VideoSuggestion[]> => {
    if (!theme) return [];

    setIsLoadingSuggestions(true);
    
    try {
      const response = await supabase.functions.invoke('suggest-rmr-videos', {
        body: {
          theme,
          context,
          categories,
          maxDurationMinutes: maxDurationMinutes || 15,
          language: 'pt-BR'
        }
      });

      if (response.error) throw response.error;

      const newSuggestions = response.data.suggestions as VideoSuggestion[];
      setSuggestions(newSuggestions);
      
      return newSuggestions;

    } catch (error) {
      console.error('Error fetching video suggestions:', error);
      toast.error('Erro ao buscar sugestões de vídeo');
      return [];
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Search videos by keyword
  const searchVideos = useCallback((query: string): VideoLibraryItem[] => {
    if (!query || query.length < 2) return videoLibrary;

    const lowerQuery = query.toLowerCase();
    return videoLibrary.filter(video => 
      video.title.toLowerCase().includes(lowerQuery) ||
      video.channel_name?.toLowerCase().includes(lowerQuery) ||
      video.description?.toLowerCase().includes(lowerQuery) ||
      video.keywords?.some(k => k.toLowerCase().includes(lowerQuery)) ||
      video.categories?.some(c => c.toLowerCase().includes(lowerQuery))
    );
  }, [videoLibrary]);

  // Filter videos by category
  const filterByCategory = useCallback((category: string): VideoLibraryItem[] => {
    if (!category) return videoLibrary;
    return videoLibrary.filter(video => 
      video.categories?.includes(category)
    );
  }, [videoLibrary]);

  // Save selected video to RMR
  const saveVideoToRMRMutation = useMutation({
    mutationFn: async (data: {
      rmrId?: string;
      video: VideoSuggestion | VideoLibraryItem;
      suggestedByAI?: boolean;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const videoData = {
        rmr_id: data.rmrId || null,
        user_id: user.id,
        video_id: 'video_id' in data.video ? data.video.video_id : data.video.id,
        youtube_url: data.video.youtube_url,
        youtube_id: data.video.youtube_id,
        title: data.video.title,
        suggested_by_ai: data.suggestedByAI || false,
        was_used: true,
        notes: data.notes || null
      };

      const { error } = await supabase
        .from('rmr_video_suggestions')
        .insert(videoData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmr-video-history'] });
      toast.success('Vídeo salvo na RMR!');
    },
    onError: (error) => {
      console.error('Error saving video:', error);
      toast.error('Erro ao salvar vídeo');
    }
  });

  // Rate a video
  const rateVideoMutation = useMutation({
    mutationFn: async (data: { suggestionId: string; rating: number }) => {
      const { error } = await supabase
        .from('rmr_video_suggestions')
        .update({ user_rating: data.rating })
        .eq('id', data.suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmr-video-history'] });
    }
  });

  // Get available categories
  const getCategories = useCallback((): string[] => {
    const categoriesSet = new Set<string>();
    videoLibrary.forEach(video => {
      video.categories?.forEach(cat => categoriesSet.add(cat));
    });
    return Array.from(categoriesSet).sort();
  }, [videoLibrary]);

  // Format duration for display
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    suggestions,
    videoLibrary,
    videoHistory,
    isLoadingSuggestions,
    isLoadingLibrary,
    isLoadingHistory,
    fetchSuggestions,
    searchVideos,
    filterByCategory,
    getCategories,
    formatDuration,
    saveVideoToRMR: saveVideoToRMRMutation.mutate,
    isSavingVideo: saveVideoToRMRMutation.isPending,
    rateVideo: rateVideoMutation.mutate
  };
};
