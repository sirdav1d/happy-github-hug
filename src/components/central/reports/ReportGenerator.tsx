import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Loader2, 
  Calendar,
  TrendingUp,
  Users,
  Target,
  Sparkles
} from 'lucide-react';

interface ReportGeneratorProps {
  onClose?: () => void;
}

interface ReportData {
  title: string;
  period: string;
  companyName: string;
  generatedAt: string;
  summary: {
    totalRevenue: number;
    totalSales: number;
    avgTicket: number;
    monthlyGoal: number;
    progress: string;
  };
  teamPerformance: {
    name: string;
    revenue: number;
    goal: number;
    progress: string;
    salesCount: number;
  }[];
  insights: string[];
}

export default function ReportGenerator({ onClose }: ReportGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'rmr'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const years = [2024, 2025, 2026];

  const handleGenerate = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setReportData(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          userId: user.id,
          reportType,
          month: selectedMonth,
          year: selectedYear,
        },
      });

      if (error) throw error;

      setReportData(data);
      
      toast({
        title: 'Relatório gerado!',
        description: 'O relatório foi gerado com sucesso.',
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!reportData) return;

    // Create a simple text version for download
    const content = `
${reportData.title}
${reportData.period}
Empresa: ${reportData.companyName}
Gerado em: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}

=== RESUMO ===
Faturamento Total: R$ ${reportData.summary.totalRevenue.toLocaleString('pt-BR')}
Total de Vendas: ${reportData.summary.totalSales}
Ticket Médio: R$ ${reportData.summary.avgTicket.toLocaleString('pt-BR')}
Meta: R$ ${reportData.summary.monthlyGoal.toLocaleString('pt-BR')}
Progresso: ${reportData.summary.progress}%

=== DESEMPENHO DA EQUIPE ===
${reportData.teamPerformance.map(m => 
  `${m.name}: R$ ${m.revenue.toLocaleString('pt-BR')} (${m.progress}% da meta)`
).join('\n')}

=== INSIGHTS ===
${reportData.insights.join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${selectedMonth}-${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download iniciado',
      description: 'O relatório está sendo baixado.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Gerador de Relatórios</CardTitle>
            <CardDescription>Gere relatórios detalhados do seu desempenho</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Tipo de Relatório
            </label>
            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="rmr">RMR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Mês
            </label>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Ano
            </label>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Relatório
            </>
          )}
        </Button>

        {/* Report Preview */}
        {reportData && (
          <>
            <Separator />
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{reportData.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {reportData.period}
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Faturamento
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(reportData.summary.totalRevenue)}
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Target className="w-4 h-4" />
                    Progresso
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {reportData.summary.progress}%
                  </p>
                </div>
              </div>

              {/* Team Performance */}
              {reportData.teamPerformance.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Desempenho da Equipe
                  </h4>
                  <div className="space-y-2">
                    {reportData.teamPerformance.slice(0, 5).map((member, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {idx + 1}
                          </span>
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">{formatCurrency(member.revenue)}</span>
                          <Badge variant={Number(member.progress) >= 100 ? 'default' : 'secondary'}>
                            {member.progress}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {reportData.insights.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Insights
                  </h4>
                  <div className="space-y-2">
                    {reportData.insights.map((insight, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm"
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
