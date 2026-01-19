import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Sparkles, 
  Search, 
  Filter, 
  RefreshCw,
  Lock,
  ChevronDown,
  Globe,
  Library,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VideoCard } from './VideoCard';
import { VideoPreviewModal } from './VideoPreviewModal';
import { AddExternalVideoModal } from './AddExternalVideoModal';
import { useVideoSuggestions, VideoSuggestion } from '@/hooks/useVideoSuggestions';
import { useFavoriteVideos } from '@/hooks/useFavoriteVideos';
import { useYouTubeSearch, YouTubeSearchSuggestion } from '@/hooks/useYouTubeSearch';
import { cn } from '@/lib/utils';

interface VideoSuggestionPanelProps {
  theme: string;
  context?: string;
  isPhase2: boolean;
  selectedVideoId?: string;
  onSelectVideo?: (video: VideoSuggestion, notes?: string) => void;
  className?: string;
}

export const VideoSuggestionPanel: React.FC<VideoSuggestionPanelProps> = ({
  theme,
  context,
  isPhase2,
  selectedVideoId,
  onSelectVideo,
  className
}) => {
  const {
    suggestions,
    isLoadingSuggestions,
    fetchSuggestions,
    getCategories
  } = useVideoSuggestions();

  const {
    isFavorited,
    addFavorite,
    removeFavorite,
    getFavoriteByYoutubeId
  } = useFavoriteVideos();

  const {
    suggestions: searchSuggestions,
    isLoading: isLoadingSearch,
    generateSearchSuggestions,
    openSearch
  } = useYouTubeSearch();

  const [activeTab, setActiveTab] = useState<'library' | 'discover'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoSuggestion | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);

  // Fetch library suggestions when theme changes
  useEffect(() => {
    if (theme && !hasFetched) {
      fetchSuggestions(theme, context);
      setHasFetched(true);
    }
  }, [theme, context, hasFetched, fetchSuggestions]);

  // Fetch YouTube search suggestions when switching to discover tab
  useEffect(() => {
    if (activeTab === 'discover' && theme && !hasSearched) {
      generateSearchSuggestions(theme, context);
      setHasSearched(true);
    }
  }, [activeTab, theme, context, hasSearched, generateSearchSuggestions]);

  const handleRefresh = () => {
    if (activeTab === 'library') {
      fetchSuggestions(theme, context);
    } else {
      generateSearchSuggestions(theme, context);
    }
  };

  const handleToggleFavorite = (video: VideoSuggestion) => {
    const favorite = getFavoriteByYoutubeId(video.youtube_id);
    if (favorite) {
      removeFavorite(favorite.id);
    } else {
      addFavorite({
        video_id: video.video_id,
        youtube_url: video.youtube_url,
        youtube_id: video.youtube_id,
        title: video.title
      });
    }
  };

  const categories = getCategories();

  // Filter library by search and category
  const filteredSuggestions = suggestions.filter(video => {
    const matchesSearch = !searchQuery || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.channel_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      video.categories?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const isLoading = activeTab === 'library' ? isLoadingSuggestions : isLoadingSearch;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Sugestões de Vídeo</h3>
          {!isPhase2 && (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Visualização
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Theme Context */}
      <div className="p-3 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 inline mr-1 text-primary" />
          Tema: <span className="font-medium text-foreground">"{theme}"</span>
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'discover')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Biblioteca
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Descobrir Novos
          </TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4 mt-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na biblioteca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  {selectedCategory || 'Categoria'}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                  Todas
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Loading State */}
          {isLoadingSuggestions && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Video Grid */}
          {!isLoadingSuggestions && filteredSuggestions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuggestions.map((video, index) => (
                <motion.div
                  key={video.video_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VideoCard
                    videoId={video.video_id}
                    youtubeId={video.youtube_id}
                    youtubeUrl={video.youtube_url}
                    title={video.title}
                    channelName={video.channel_name}
                    thumbnailUrl={video.thumbnail_url}
                    durationFormatted={video.duration_formatted}
                    categories={video.categories}
                    relevanceScore={video.relevance_score}
                    aiReason={video.ai_reason}
                    isFavorited={isFavorited(video.youtube_id)}
                    isSelected={selectedVideoId === video.video_id}
                    isPhase2={isPhase2}
                    onSelect={() => onSelectVideo?.(video)}
                    onPreview={() => setPreviewVideo(video)}
                    onToggleFavorite={() => handleToggleFavorite(video)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty Library State */}
          {!isLoadingSuggestions && filteredSuggestions.length === 0 && (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory 
                  ? 'Nenhum vídeo encontrado com esses filtros'
                  : 'Nenhuma sugestão disponível para este tema'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={handleRefresh}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4 mt-4">
          {/* Info Banner */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Descubra vídeos no YouTube</p>
                <p className="text-xs text-muted-foreground mt-1">
                  A IA gerou buscas otimizadas para seu tema. Encontre o vídeo perfeito e adicione à biblioteca!
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingSearch && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {!isLoadingSearch && searchSuggestions.length > 0 && (
            <div className="space-y-3">
              {searchSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className="font-medium text-sm truncate">
                          "{suggestion.search_query}"
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.estimated_results_type}
                        </Badge>
                        {suggestion.suggested_channels.slice(0, 2).map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openSearch(suggestion.search_url)}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Buscar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add Video Button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddVideoModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Vídeo do YouTube
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Encontrou um vídeo bom? Cole o link para adicionar à biblioteca
            </p>
          </div>

          {/* Empty State */}
          {!isLoadingSearch && searchSuggestions.length === 0 && (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Não foi possível gerar sugestões de busca
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => generateSearchSuggestions(theme, context)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Phase 1 Info */}
      {!isPhase2 && suggestions.length > 0 && activeTab === 'library' && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Desbloqueie a seleção de vídeos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Na Fase 2, você pode selecionar vídeos para sua RMR com um clique
                e salvá-los nos favoritos para uso futuro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <VideoPreviewModal
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
          youtubeId={previewVideo.youtube_id}
          youtubeUrl={previewVideo.youtube_url}
          title={previewVideo.title}
          channelName={previewVideo.channel_name}
          durationFormatted={previewVideo.duration_formatted}
          categories={previewVideo.categories}
          relevanceScore={previewVideo.relevance_score}
          aiReason={previewVideo.ai_reason}
          isFavorited={isFavorited(previewVideo.youtube_id)}
          isSelected={selectedVideoId === previewVideo.video_id}
          isPhase2={isPhase2}
          onSelect={(notes) => {
            onSelectVideo?.(previewVideo, notes);
            setPreviewVideo(null);
          }}
          onToggleFavorite={() => handleToggleFavorite(previewVideo)}
        />
      )}

      {/* Add External Video Modal */}
      <AddExternalVideoModal
        open={showAddVideoModal}
        onOpenChange={setShowAddVideoModal}
        onVideoAdded={() => {
          fetchSuggestions(theme, context);
          setActiveTab('library');
        }}
      />
    </div>
  );
};

export default VideoSuggestionPanel;
