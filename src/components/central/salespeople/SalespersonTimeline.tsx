import { motion } from 'framer-motion';
import { History, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Salesperson } from '@/hooks/useSalespeople';
import { useSalespersonEvents } from '@/hooks/useSalespersonEvents';

interface SalespersonTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesperson?: Salesperson | null;
}

export function SalespersonTimeline({ open, onOpenChange, salesperson }: SalespersonTimelineProps) {
  const { events, isLoading, getEventIcon, getEventColor, formatEventDate } = useSalespersonEvents(salesperson?.id);

  if (!salesperson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de {salesperson.name}
          </DialogTitle>
          <DialogDescription>
            Linha do tempo de eventos do vendedor
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2" />
              <p>Nenhum evento registrado</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-10"
                  >
                    {/* Event dot */}
                    <div className="absolute left-2 top-1.5 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs">
                      {getEventIcon(event.event_type)}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-medium text-sm ${getEventColor(event.event_type)}`}>
                          {event.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatEventDate(event.event_date)}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}

                      {event.details && Object.keys(event.details).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {Object.entries(event.details).map(([key, value]) => (
                              value && (
                                <span key={key} className="bg-background px-2 py-0.5 rounded">
                                  {key.replace(/_/g, ' ')}: {String(value)}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
