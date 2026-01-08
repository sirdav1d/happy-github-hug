import { useState } from 'react';
import { StudentDashboardData } from '@/hooks/useAgencyDashboard';
import { CreateSessionData } from '@/hooks/useMentoringSessions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Link2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MentoringScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentDashboardData[];
  onSchedule: (data: CreateSessionData) => Promise<boolean>;
  preselectedStudentId?: string;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

export default function MentoringScheduleModal({
  open,
  onOpenChange,
  students,
  onSchedule,
  preselectedStudentId,
}: MentoringScheduleModalProps) {
  const [studentId, setStudentId] = useState(preselectedStudentId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStudents = students.filter(s => s.status === 'registered' && s.registeredUserId);

  const resetForm = () => {
    setStudentId(preselectedStudentId || '');
    setTitle('');
    setDescription('');
    setDate(undefined);
    setTime('10:00');
    setDuration(60);
    setMeetingLink('');
  };

  const handleSubmit = async () => {
    if (!studentId || !title || !date) return;

    const selectedStudent = activeStudents.find(s => s.registeredUserId === studentId);
    if (!selectedStudent?.registeredUserId) return;

    setIsSubmitting(true);

    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const success = await onSchedule({
      student_id: selectedStudent.registeredUserId,
      title,
      description: description || undefined,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: duration,
      meeting_link: meetingLink || undefined,
    });

    setIsSubmitting(false);

    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isValid = studentId && title && date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar Nova Mentoria</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map(student => (
                  <SelectItem key={student.id} value={student.registeredUserId!}>
                    {student.companyName || student.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título / Assunto *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisão de Metas Q1"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label>Link da Reunião (opcional)</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição / Pauta (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tópicos a serem discutidos..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Agendar Mentoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
