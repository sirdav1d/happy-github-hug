import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  Play,
  Clock,
  Eye,
  Star
} from 'lucide-react';
import { formatDuration } from '@/lib/youtubeUtils';
import type { VideoLibraryItem } from '@/hooks/useVideoLibraryAdmin';

interface VideoLibraryCardProps {
  video: VideoLibraryItem;
  onEdit: (video: VideoLibraryItem) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function VideoLibraryCard({ 
  video, 
  onEdit, 
  onToggleStatus, 
  onDelete 
}: VideoLibraryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      await onToggleStatus(video.id, !video.is_active);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = () => {
    onDelete(video.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={`overflow-hidden transition-all ${!video.is_active ? 'opacity-60' : ''}`}>
        <div className="relative">
          {/* Thumbnail */}
          <div className="aspect-video bg-muted relative group">
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Play overlay */}
            <a 
              href={video.youtube_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Play className="w-16 h-16 text-white" fill="white" />
            </a>

            {/* Duration badge */}
            {video.duration_seconds && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration_seconds)}
              </div>
            )}

            {/* Status badge */}
            {!video.is_active && (
              <Badge variant="secondary" className="absolute top-2 left-2">
                Inativo
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title and Menu */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1" title={video.title}>
              {video.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(video)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={video.youtube_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir no YouTube
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Channel */}
          {video.channel_name && (
            <p className="text-xs text-muted-foreground mb-3">
              {video.channel_name}
            </p>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-1 mb-3">
            {video.categories.slice(0, 3).map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
            {video.categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{video.categories.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{video.times_used} usos</span>
            </div>
            {video.average_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>{video.average_rating.toFixed(1)}</span>
              </div>
            )}
            {video.duration_seconds && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(video.duration_seconds)}</span>
              </div>
            )}
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              {video.is_active ? 'Ativo' : 'Inativo'}
            </span>
            <Switch 
              checked={video.is_active} 
              onCheckedChange={handleToggleStatus}
              disabled={isTogglingStatus}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vídeo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo "{video.title}" será removido permanentemente do repositório.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
