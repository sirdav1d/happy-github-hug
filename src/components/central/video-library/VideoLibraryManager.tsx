import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Video, 
  Eye, 
  EyeOff, 
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useVideoLibraryAdmin, type VideoLibraryItem } from '@/hooks/useVideoLibraryAdmin';
import { VideoLibraryCard } from './VideoLibraryCard';
import { VideoLibraryForm } from './VideoLibraryForm';
import { VIDEO_CATEGORIES } from '@/lib/youtubeUtils';

export function VideoLibraryManager() {
  const {
    videos,
    isLoading,
    refetch,
    addVideo,
    updateVideo,
    toggleStatus,
    deleteVideo,
    isAdding,
    isUpdating,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    allCategories,
    stats,
  } = useVideoLibraryAdmin();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLibraryItem | null>(null);

  const handleAddClick = () => {
    setEditingVideo(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (video: VideoLibraryItem) => {
    setEditingVideo(video);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Parameters<typeof addVideo>[0]) => {
    if (editingVideo) {
      await updateVideo({ id: editingVideo.id, updates: data });
    } else {
      await addVideo(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Biblioteca de Vídeos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os vídeos motivacionais disponíveis para as RMRs
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Vídeo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Vídeos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <EyeOff className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-xs text-muted-foreground">Total de Usos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, canal ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {VIDEO_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Active filters */}
      {(searchTerm || categoryFilter || statusFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {searchTerm && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
              Busca: "{searchTerm}" ×
            </Badge>
          )}
          {categoryFilter && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategoryFilter(null)}>
              {categoryFilter} ×
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
              {statusFilter === 'active' ? 'Ativos' : 'Inativos'} ×
            </Badge>
          )}
        </div>
      )}

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || categoryFilter || statusFilter !== 'all'
                ? 'Nenhum vídeo encontrado'
                : 'Biblioteca vazia'
              }
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {searchTerm || categoryFilter || statusFilter !== 'all'
                ? 'Tente ajustar os filtros ou fazer uma nova busca'
                : 'Adicione seu primeiro vídeo motivacional para começar a usar nas RMRs'
              }
            </p>
            {!searchTerm && !categoryFilter && statusFilter === 'all' && (
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Vídeo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {videos.length} {videos.length === 1 ? 'vídeo encontrado' : 'vídeos encontrados'}
          </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoLibraryCard
              key={video.id}
              video={video}
              onEdit={handleEditClick}
              onToggleStatus={(id, isActive) => toggleStatus({ id, isActive })}
              onDelete={deleteVideo}
            />
            ))}
          </div>
        </>
      )}

      {/* Form Dialog */}
      <VideoLibraryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        video={editingVideo}
        onSubmit={handleFormSubmit}
        isSubmitting={isAdding || isUpdating}
      />
    </div>
  );
}
