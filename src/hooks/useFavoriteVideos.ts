import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FavoriteVideo {
  id: string;
  user_id: string;
  video_id: string | null;
  youtube_url: string;
  youtube_id: string;
  title: string;
  custom_notes: string | null;
  created_at: string;
  // Joined data from video_library
  channel_name?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  categories?: string[];
}

export const useFavoriteVideos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's favorite videos
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorite-videos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_favorite_videos')
        .select(`
          *,
          video_library (
            channel_name,
            duration_seconds,
            thumbnail_url,
            categories
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the joined data
      return data.map(fav => ({
        ...fav,
        channel_name: fav.video_library?.channel_name,
        duration_seconds: fav.video_library?.duration_seconds,
        thumbnail_url: fav.video_library?.thumbnail_url || `https://img.youtube.com/vi/${fav.youtube_id}/hqdefault.jpg`,
        categories: fav.video_library?.categories
      })) as FavoriteVideo[];
    },
    enabled: !!user?.id,
  });

  // Add video to favorites
  const addFavoriteMutation = useMutation({
    mutationFn: async (data: {
      video_id?: string;
      youtube_url: string;
      youtube_id: string;
      title: string;
      custom_notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if already favorited
      const { data: existing } = await supabase
        .from('user_favorite_videos')
        .select('id')
        .eq('user_id', user.id)
        .eq('youtube_id', data.youtube_id)
        .maybeSingle();

      if (existing) {
        throw new Error('Vídeo já está nos favoritos');
      }

      const { error } = await supabase
        .from('user_favorite_videos')
        .insert({
          user_id: user.id,
          video_id: data.video_id || null,
          youtube_url: data.youtube_url,
          youtube_id: data.youtube_id,
          title: data.title,
          custom_notes: data.custom_notes || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-videos'] });
      toast.success('Vídeo adicionado aos favoritos!');
    },
    onError: (error) => {
      if (error.message.includes('já está nos favoritos')) {
        toast.info('Este vídeo já está nos seus favoritos');
      } else {
        console.error('Error adding to favorites:', error);
        toast.error('Erro ao adicionar aos favoritos');
      }
    }
  });

  // Remove video from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from('user_favorite_videos')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-videos'] });
      toast.success('Vídeo removido dos favoritos');
    },
    onError: (error) => {
      console.error('Error removing from favorites:', error);
      toast.error('Erro ao remover dos favoritos');
    }
  });

  // Update notes on favorite
  const updateNotesMutation = useMutation({
    mutationFn: async (data: { favoriteId: string; notes: string }) => {
      const { error } = await supabase
        .from('user_favorite_videos')
        .update({ custom_notes: data.notes })
        .eq('id', data.favoriteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-videos'] });
      toast.success('Notas atualizadas');
    },
    onError: (error) => {
      console.error('Error updating notes:', error);
      toast.error('Erro ao atualizar notas');
    }
  });

  // Check if a video is favorited
  const isFavorited = (youtubeId: string): boolean => {
    return favorites.some(fav => fav.youtube_id === youtubeId);
  };

  // Get favorite by youtube ID
  const getFavoriteByYoutubeId = (youtubeId: string): FavoriteVideo | undefined => {
    return favorites.find(fav => fav.youtube_id === youtubeId);
  };

  // Format duration for display
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    favorites,
    isLoading,
    addFavorite: addFavoriteMutation.mutate,
    isAdding: addFavoriteMutation.isPending,
    removeFavorite: removeFavoriteMutation.mutate,
    isRemoving: removeFavoriteMutation.isPending,
    updateNotes: updateNotesMutation.mutate,
    isUpdating: updateNotesMutation.isPending,
    isFavorited,
    getFavoriteByYoutubeId,
    formatDuration
  };
};
