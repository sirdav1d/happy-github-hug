import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  Check, 
  ExternalLink, 
  Clock,
  Lock,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  channelName?: string;
  durationFormatted?: string;
  categories?: string[];
  relevanceScore?: number;
  aiReason?: string;
  isFavorited?: boolean;
  isSelected?: boolean;
  isPhase2?: boolean;
  onSelect?: (notes?: string) => void;
  onToggleFavorite?: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  youtubeId,
  youtubeUrl,
  title,
  channelName,
  durationFormatted,
  categories = [],
  relevanceScore,
  aiReason,
  isFavorited = false,
  isSelected = false,
  isPhase2 = true,
  onSelect,
  onToggleFavorite
}) => {
  const [notes, setNotes] = useState('');

  const handleSelect = () => {
    onSelect?.(notes || undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {relevanceScore !== undefined && (
                  <Badge variant="default" className="bg-primary">
                    {relevanceScore}% relevante
                  </Badge>
                )}
                {durationFormatted && (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {durationFormatted}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{title}</h2>
                  {channelName && (
                    <p className="text-muted-foreground">{channelName}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPhase2 && onToggleFavorite && (
                    <Button
                      variant={isFavorited ? "default" : "outline"}
                      size="sm"
                      onClick={onToggleFavorite}
                      className={cn(isFavorited && "bg-red-500 hover:bg-red-600")}
                    >
                      <Heart className={cn("h-4 w-4 mr-1", isFavorited && "fill-current")} />
                      {isFavorited ? 'Favoritado' : 'Favoritar'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(youtubeUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    YouTube
                  </Button>
                </div>
              </div>

              {/* AI Reason */}
              {aiReason && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-sm">
                    <span className="font-medium text-primary">Por que este vídeo: </span>
                    {aiReason}
                  </p>
                </div>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Notes for RMR */}
              {isPhase2 && onSelect && (
                <div className="space-y-3 pt-4 border-t">
                  <Label htmlFor="video-notes" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notas para a RMR (opcional)
                  </Label>
                  <Textarea
                    id="video-notes"
                    placeholder="Ex: Passar apenas os primeiros 5 minutos, focar na parte sobre liderança..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                
                {isPhase2 && onSelect && (
                  <Button onClick={handleSelect} disabled={isSelected}>
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Já selecionado
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Usar este vídeo na RMR
                      </>
                    )}
                  </Button>
                )}

                {!isPhase2 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Seleção disponível na Fase 2</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPreviewModal;
