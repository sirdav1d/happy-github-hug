import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoLibraryItem {
  id: string;
  title: string;
  youtube_id: string;
  youtube_url: string;
  thumbnail_url: string | null;
  channel_name: string | null;
  description: string | null;
  duration_seconds: number | null;
  categories: string[];
  keywords: string[] | null;
  language: string;
  is_active: boolean;
  times_used: number;
  average_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface VideoFormData {
  title: string;
  youtube_id: string;
  youtube_url: string;
  thumbnail_url?: string;
  channel_name?: string;
  description?: string;
  duration_seconds?: number;
  categories: string[];
  keywords?: string[];
  language?: string;
  is_active?: boolean;
}

export function useVideoLibraryAdmin() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch all videos (including inactive ones for admin)
  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ['video-library-admin'],
    queryFn: async () => {
      // Consultants can see all videos due to the RLS policies we just added
      const { data, error } = await supabase
        .from('video_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      return data as VideoLibraryItem[];
    },
  });

  // Add new video
  const addVideoMutation = useMutation({
    mutationFn: async (videoData: VideoFormData) => {
      const { data, error } = await supabase
        .from('video_library')
        .insert({
          title: videoData.title,
          youtube_id: videoData.youtube_id,
          youtube_url: videoData.youtube_url,
          thumbnail_url: videoData.thumbnail_url || null,
          channel_name: videoData.channel_name || null,
          description: videoData.description || null,
          duration_seconds: videoData.duration_seconds || null,
          categories: videoData.categories,
          keywords: videoData.keywords || [],
          language: videoData.language || 'pt-BR',
          is_active: videoData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-admin'] });
      queryClient.invalidateQueries({ queryKey: ['video-library'] });
      toast.success('Vídeo adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding video:', error);
      toast.error('Erro ao adicionar vídeo');
    },
  });

  // Update video
  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VideoFormData> }) => {
      const { data, error } = await supabase
        .from('video_library')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-admin'] });
      queryClient.invalidateQueries({ queryKey: ['video-library'] });
      toast.success('Vídeo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating video:', error);
      toast.error('Erro ao atualizar vídeo');
    },
  });

  // Toggle video status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('video_library')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-library-admin'] });
      queryClient.invalidateQueries({ queryKey: ['video-library'] });
      toast.success(variables.isActive ? 'Vídeo ativado!' : 'Vídeo desativado!');
    },
    onError: (error) => {
      console.error('Error toggling video status:', error);
      toast.error('Erro ao alterar status do vídeo');
    },
  });

  // Delete video
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('video_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library-admin'] });
      queryClient.invalidateQueries({ queryKey: ['video-library'] });
      toast.success('Vídeo excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting video:', error);
      toast.error('Erro ao excluir vídeo');
    },
  });

  // Filter videos based on search and filters
  const filteredVideos = videos.filter((video) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        video.title.toLowerCase().includes(search) ||
        video.channel_name?.toLowerCase().includes(search) ||
        video.description?.toLowerCase().includes(search) ||
        video.keywords?.some(k => k.toLowerCase().includes(search));
      
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter && !video.categories.includes(categoryFilter)) {
      return false;
    }

    // Status filter
    if (statusFilter === 'active' && !video.is_active) return false;
    if (statusFilter === 'inactive' && video.is_active) return false;

    return true;
  });

  // Get unique categories from all videos
  const allCategories = [...new Set(videos.flatMap(v => v.categories))].sort();

  // Statistics
  const stats = {
    total: videos.length,
    active: videos.filter(v => v.is_active).length,
    inactive: videos.filter(v => !v.is_active).length,
    totalUsage: videos.reduce((sum, v) => sum + v.times_used, 0),
  };

  return {
    videos: filteredVideos,
    allVideos: videos,
    isLoading,
    refetch,
    
    // Mutations
    addVideo: addVideoMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    toggleStatus: toggleStatusMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
    
    // Loading states
    isAdding: addVideoMutation.isPending,
    isUpdating: updateVideoMutation.isPending,
    isDeleting: deleteVideoMutation.isPending,
    
    // Filters
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    
    // Data
    allCategories,
    stats,
  };
}
