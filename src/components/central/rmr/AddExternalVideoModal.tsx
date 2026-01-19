import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link as LinkIcon, Play, Plus, X, ExternalLink } from 'lucide-react';
import { parseYouTubeUrl, isValidYouTubeUrl, VIDEO_CATEGORIES } from '@/lib/youtubeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface AddExternalVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedUrl?: string;
  onVideoAdded?: () => void;
}

export const AddExternalVideoModal: React.FC<AddExternalVideoModalProps> = ({
  open,
  onOpenChange,
  suggestedUrl,
  onVideoAdded
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (suggestedUrl) {
        setYoutubeUrl(suggestedUrl);
      } else {
        setYoutubeUrl('');
      }
      setTitle('');
      setChannelName('');
      setDuration('');
      setSelectedCategories([]);
      setThumbnailPreview(null);
      setYoutubeId(null);
    }
  }, [open, suggestedUrl]);

  // Parse URL when it changes
  useEffect(() => {
    if (youtubeUrl && isValidYouTubeUrl(youtubeUrl)) {
      const parsed = parseYouTubeUrl(youtubeUrl);
      if (parsed) {
        setThumbnailPreview(parsed.thumbnailUrl);
        setYoutubeId(parsed.youtubeId);
      }
    } else {
      setThumbnailPreview(null);
      setYoutubeId(null);
    }
  }, [youtubeUrl]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const parseDurationToSeconds = (durationStr: string): number | null => {
    if (!durationStr) return null;
    const parts = durationStr.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!youtubeUrl || !isValidYouTubeUrl(youtubeUrl)) {
      toast.error('URL do YouTube inválida');
      return;
    }

    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

    const parsed = parseYouTubeUrl(youtubeUrl);
    if (!parsed) {
      toast.error('Não foi possível processar a URL');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if video already exists
      const { data: existing } = await supabase
        .from('video_library')
        .select('id')
        .eq('youtube_id', parsed.youtubeId)
        .single();

      if (existing) {
        toast.info('Este vídeo já está na biblioteca!');
        onOpenChange(false);
        return;
      }

      // Add to video library
      const { error } = await supabase
        .from('video_library')
        .insert({
          youtube_id: parsed.youtubeId,
          youtube_url: parsed.youtubeUrl,
          thumbnail_url: parsed.thumbnailUrl,
          title: title.trim(),
          channel_name: channelName.trim() || null,
          duration_seconds: parseDurationToSeconds(duration),
          categories: selectedCategories,
          keywords: [],
          language: 'pt-BR',
          is_active: true,
          times_used: 0
        });

      if (error) throw error;

      toast.success('Vídeo adicionado à biblioteca!');
      queryClient.invalidateQueries({ queryKey: ['video-library'] });
      onVideoAdded?.();
      onOpenChange(false);

    } catch (err) {
      console.error('Error adding video:', err);
      toast.error('Erro ao adicionar vídeo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = youtubeUrl && isValidYouTubeUrl(youtubeUrl) && title.trim() && selectedCategories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Vídeo do YouTube</DialogTitle>
          <DialogDescription>
            Encontrou um vídeo interessante? Adicione à biblioteca para usar nas RMRs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* YouTube URL */}
          <div className="space-y-2">
            <Label htmlFor="youtube-url">URL do YouTube *</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Thumbnail Preview */}
          {thumbnailPreview && (
            <div className="relative aspect-video max-w-xs rounded-lg overflow-hidden bg-muted">
              <img 
                src={thumbnailPreview} 
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-10 h-10 text-white" fill="white" />
              </div>
              <a 
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-white" />
              </a>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do vídeo"
            />
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label htmlFor="channel">Canal (opcional)</Label>
            <Input
              id="channel"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Nome do canal"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (opcional)</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="mm:ss (ex: 5:30)"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categorias *</Label>
            <div className="flex flex-wrap gap-2">
              {VIDEO_CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => handleCategoryToggle(category)}
                >
                  {selectedCategories.includes(category) ? (
                    <X className="h-3 w-3 mr-1" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar à Biblioteca
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
