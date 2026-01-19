import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Star, 
  Heart, 
  HeartOff, 
  Check,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  videoId: string;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  durationFormatted?: string;
  categories?: string[];
  relevanceScore?: number;
  aiReason?: string;
  isFavorited?: boolean;
  isSelected?: boolean;
  isPhase2?: boolean;
  compact?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  onToggleFavorite?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  videoId,
  youtubeId,
  youtubeUrl,
  title,
  channelName,
  thumbnailUrl,
  durationFormatted,
  categories = [],
  relevanceScore,
  aiReason,
  isFavorited = false,
  isSelected = false,
  isPhase2 = true,
  compact = false,
  onSelect,
  onPreview,
  onToggleFavorite
}) => {
  const thumbnail = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg border transition-all",
          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          !isPhase2 && "opacity-75"
        )}
      >
        <div 
          className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0 cursor-pointer group"
          onClick={onPreview}
        >
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="h-4 w-4 text-white" />
          </div>
          {durationFormatted && (
            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1 rounded">
              {durationFormatted}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          {channelName && (
            <p className="text-xs text-muted-foreground truncate">{channelName}</p>
          )}
        </div>

        {isPhase2 && onSelect && (
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            className="flex-shrink-0"
            onClick={onSelect}
          >
            {isSelected ? <Check className="h-4 w-4" /> : "Usar"}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border overflow-hidden transition-all",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
        !isPhase2 && "relative"
      )}
    >
      {/* Locked Overlay for Phase 1 */}
      {!isPhase2 && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Fase 2</p>
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div 
        className="relative aspect-video cursor-pointer group"
        onClick={onPreview}
      >
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"
          >
            <Play className="h-5 w-5 text-black ml-0.5" />
          </motion.div>
        </div>
        
        {/* Duration Badge */}
        {durationFormatted && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {durationFormatted}
          </span>
        )}

        {/* Relevance Score */}
        {relevanceScore !== undefined && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-current" />
            <span>{relevanceScore}%</span>
          </div>
        )}

        {/* Favorite Button */}
        {isPhase2 && onToggleFavorite && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  "absolute top-2 right-2 p-1.5 rounded-full transition-all",
                  isFavorited 
                    ? "bg-red-500 text-white" 
                    : "bg-black/50 text-white hover:bg-black/70"
                )}
              >
                {isFavorited ? (
                  <Heart className="h-4 w-4 fill-current" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-medium text-sm line-clamp-2 mb-1">{title}</h4>
        
        {channelName && (
          <p className="text-xs text-muted-foreground mb-2">{channelName}</p>
        )}

        {/* AI Reason */}
        {aiReason && (
          <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
            "{aiReason}"
          </p>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.slice(0, 3).map((category) => (
              <Badge key={category} variant="secondary" className="text-[10px] px-1.5 py-0">
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isPhase2 && onSelect && (
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className="flex-1"
              onClick={onSelect}
            >
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Selecionado
                </>
              ) : (
                'Usar na RMR'
              )}
            </Button>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="px-2"
                onClick={() => window.open(youtubeUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir no YouTube</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
