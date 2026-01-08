import { useState, useMemo } from 'react';
import { MentoringSession } from '@/hooks/useMentoringSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  ExternalLink, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow, isThisWeek, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MentoringCalendarProps {
  sessions: MentoringSession[];
  onNewSession: () => void;
  onCompleteSession: (id: string) => void;
  onCancelSession: (id: string) => void;
}

interface GroupedSessions {
  label: string;
  date?: Date;
  sessions: MentoringSession[];
}

export default function MentoringCalendar({
  sessions,
  onNewSession,
  onCompleteSession,
  onCancelSession,
}: MentoringCalendarProps) {
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const groups: GroupedSessions[] = [];

    // Filter only scheduled sessions
    const scheduledSessions = sessions
      .filter(s => s.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    // Group sessions
    const todaySessions = scheduledSessions.filter(s => isToday(new Date(s.scheduled_at)));
    const tomorrowSessions = scheduledSessions.filter(s => isTomorrow(new Date(s.scheduled_at)));
    const thisWeekSessions = scheduledSessions.filter(s => {
      const date = new Date(s.scheduled_at);
      return isThisWeek(date, { weekStartsOn: 1 }) && !isToday(date) && !isTomorrow(date);
    });
    const laterSessions = scheduledSessions.filter(s => {
      const date = new Date(s.scheduled_at);
      return !isThisWeek(date, { weekStartsOn: 1 });
    });

    if (todaySessions.length > 0) {
      groups.push({ label: 'Hoje', date: now, sessions: todaySessions });
    }
    if (tomorrowSessions.length > 0) {
      groups.push({ label: 'Amanhã', date: addDays(now, 1), sessions: tomorrowSessions });
    }
    if (thisWeekSessions.length > 0) {
      groups.push({ label: 'Esta Semana', sessions: thisWeekSessions });
    }
    if (laterSessions.length > 0) {
      groups.push({ label: 'Próximas', sessions: laterSessions });
    }

    return groups;
  }, [sessions]);

  const getStatusBadge = (status: MentoringSession['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400">Concluída</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400">Cancelada</Badge>;
      case 'no_show':
        return <Badge className="bg-amber-500/20 text-amber-400">Não Compareceu</Badge>;
      default:
        return <Badge className="bg-primary/20 text-primary">Agendada</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const hasNoSessions = groupedSessions.length === 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Agenda de Mentorias
          </CardTitle>
          <Button size="sm" onClick={onNewSession}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Mentoria
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasNoSessions ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma mentoria agendada
            </p>
            <Button variant="outline" onClick={onNewSession}>
              <Plus className="w-4 h-4 mr-2" />
              Agendar Primeira Mentoria
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {groupedSessions.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {group.label}
                    </h3>
                    {group.date && (
                      <span className="text-xs text-muted-foreground">
                        {format(group.date, "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {group.sessions.map((session) => {
                      const sessionDate = new Date(session.scheduled_at);
                      const isPast = sessionDate < new Date();

                      return (
                        <div
                          key={session.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            isPast 
                              ? 'bg-muted/30 border-border' 
                              : 'bg-card hover:bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground truncate">
                                  {session.title}
                                </span>
                              </div>
                              
                              <p className="text-sm text-muted-foreground truncate mb-2">
                                {session.student_company || session.student_email || 'Aluno'}
                              </p>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {format(sessionDate, 'HH:mm', { locale: ptBR })} - {formatDuration(session.duration_minutes)}
                                  </span>
                                </div>
                                
                                {!group.date && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    <span>
                                      {format(sessionDate, "dd/MM", { locale: ptBR })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {session.meeting_link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  asChild
                                >
                                  <a
                                    href={session.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Video className="w-3 h-3 mr-1" />
                                    Entrar
                                  </a>
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onCompleteSession(session.id)}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                                    Marcar como Concluída
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => onCancelSession(session.id)}
                                    className="text-red-500"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {session.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
