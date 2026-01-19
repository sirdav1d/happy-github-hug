import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Link as LinkIcon, X, Plus, Play } from 'lucide-react';
import { parseYouTubeUrl, isValidYouTubeUrl, parseDuration, VIDEO_CATEGORIES } from '@/lib/youtubeUtils';
import type { VideoLibraryItem, VideoFormData } from '@/hooks/useVideoLibraryAdmin';

const formSchema = z.object({
  youtube_url: z.string().min(1, 'URL do YouTube é obrigatória').refine(
    (val) => isValidYouTubeUrl(val),
    'URL do YouTube inválida'
  ),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  channel_name: z.string().optional(),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  duration: z.string().optional(),
  categories: z.array(z.string()).min(1, 'Selecione pelo menos uma categoria'),
  keywords: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface VideoLibraryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: VideoLibraryItem | null;
  onSubmit: (data: VideoFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function VideoLibraryForm({ 
  open, 
  onOpenChange, 
  video, 
  onSubmit, 
  isSubmitting 
}: VideoLibraryFormProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  
  const isEditing = !!video;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtube_url: '',
      title: '',
      channel_name: '',
      description: '',
      duration: '',
      categories: [],
      keywords: '',
      is_active: true,
    },
  });

  // Reset form when video changes or dialog opens
  useEffect(() => {
    if (open) {
      if (video) {
        form.reset({
          youtube_url: video.youtube_url,
          title: video.title,
          channel_name: video.channel_name || '',
          description: video.description || '',
          duration: video.duration_seconds 
            ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}`
            : '',
          categories: video.categories,
          keywords: video.keywords?.join(', ') || '',
          is_active: video.is_active,
        });
        setThumbnailPreview(video.thumbnail_url);
        setYoutubeId(video.youtube_id);
      } else {
        form.reset({
          youtube_url: '',
          title: '',
          channel_name: '',
          description: '',
          duration: '',
          categories: [],
          keywords: '',
          is_active: true,
        });
        setThumbnailPreview(null);
        setYoutubeId(null);
      }
    }
  }, [open, video, form]);

  // Parse YouTube URL when it changes
  const watchUrl = form.watch('youtube_url');
  useEffect(() => {
    if (watchUrl && isValidYouTubeUrl(watchUrl)) {
      const parsed = parseYouTubeUrl(watchUrl);
      if (parsed) {
        setThumbnailPreview(parsed.thumbnailUrl);
        setYoutubeId(parsed.youtubeId);
      }
    } else {
      if (!video) {
        setThumbnailPreview(null);
        setYoutubeId(null);
      }
    }
  }, [watchUrl, video]);

  const handleCategoryToggle = (category: string) => {
    const current = form.getValues('categories');
    if (current.includes(category)) {
      form.setValue('categories', current.filter(c => c !== category));
    } else {
      form.setValue('categories', [...current, category]);
    }
  };

  const handleFormSubmit = async (values: FormValues) => {
    const parsed = parseYouTubeUrl(values.youtube_url);
    if (!parsed) return;

    const keywords = values.keywords
      ? values.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    const formData: VideoFormData = {
      title: values.title,
      youtube_id: parsed.youtubeId,
      youtube_url: parsed.youtubeUrl,
      thumbnail_url: parsed.thumbnailUrl,
      channel_name: values.channel_name || undefined,
      description: values.description || undefined,
      duration_seconds: values.duration ? parseDuration(values.duration) || undefined : undefined,
      categories: values.categories,
      keywords: keywords.length > 0 ? keywords : undefined,
      is_active: values.is_active,
    };

    await onSubmit(formData);
    onOpenChange(false);
  };

  const selectedCategories = form.watch('categories');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isEditing ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do vídeo motivacional'
              : 'Cole o link do YouTube para adicionar um novo vídeo ao repositório'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-6">
              {/* YouTube URL */}
              <FormField
                control={form.control}
                name="youtube_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do YouTube *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Cole o link completo do vídeo no YouTube
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" fill="white" />
                  </div>
                </div>
              )}

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Título do vídeo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Channel Name */}
              <FormField
                control={form.control}
                name="channel_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do canal do YouTube" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="mm:ss (ex: 5:30)" />
                    </FormControl>
                    <FormDescription>
                      Formato: minutos:segundos (ex: 5:30 para 5 minutos e 30 segundos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categories */}
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel>Categorias *</FormLabel>
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
                    <FormDescription>
                      Selecione uma ou mais categorias para o vídeo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keywords */}
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavras-chave</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="motivação, vendas, equipe (separadas por vírgula)" />
                    </FormControl>
                    <FormDescription>
                      Palavras-chave separadas por vírgula para facilitar a busca
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Breve descrição do conteúdo do vídeo..." 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Vídeo Ativo</FormLabel>
                      <FormDescription>
                        Vídeos inativos não aparecem nas sugestões de RMR
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Salvar Alterações' : 'Adicionar Vídeo'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
