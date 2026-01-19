import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Rocket, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MentorshipSettingsProps {
  mentorshipStartDate?: string;
  onSave?: () => void;
}

const MentorshipSettings = ({ mentorshipStartDate, onSave }: MentorshipSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [startDate, setStartDate] = useState(mentorshipStartDate || '');
  const [duration, setDuration] = useState('6');

  useEffect(() => {
    if (mentorshipStartDate) {
      setStartDate(mentorshipStartDate);
    }
  }, [mentorshipStartDate]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('dashboard_data')
        .update({
          mentorship_start_date: startDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Configurações salvas!',
        description: 'Data da mentoria atualizada com sucesso.',
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving mentorship settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calcular data de término
  const getEndDate = () => {
    if (!startDate) return null;
    try {
      const start = parseISO(startDate);
      const monthsToAdd = parseInt(duration) || 6;
      const end = new Date(start);
      end.setMonth(end.getMonth() + monthsToAdd);
      return format(end, "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const endDate = getEndDate();

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Jornada de Mentoria</CardTitle>
        </div>
        <CardDescription>
          Configure as datas da mentoria para acompanhar a evolução no dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Início
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (meses)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="9">9 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        {startDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Período da Mentoria</p>
                <p className="text-muted-foreground">
                  {format(parseISO(startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até {endDate}
                </p>
                <p className="text-xs text-primary mt-1">
                  A timeline interativa será exibida no dashboard com base nessas datas
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorshipSettings;
