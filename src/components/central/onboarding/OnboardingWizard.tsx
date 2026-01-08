import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Users, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  UserPlus,
  Trash2
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface TeamMember {
  id: string;
  name: string;
}

const segmentCategories = [
  { label: '🚗 Automotivo', items: ['Concessionária de Veículos', 'Autopeças', 'Oficina Mecânica', 'Funilaria e Pintura', 'Locadora de Veículos'] },
  { label: '🏠 Construção e Imobiliário', items: ['Construtora', 'Imobiliária', 'Loja de Materiais de Construção', 'Móveis Planejados', 'Arquitetura e Design'] },
  { label: '🛍️ Varejo', items: ['Loja de Roupas', 'Calçados', 'Joalheria', 'Ótica', 'Papelaria', 'Pet Shop', 'Loja de Brinquedos', 'Eletrônicos'] },
  { label: '🍽️ Alimentação', items: ['Restaurante', 'Distribuidora de Alimentos', 'Supermercado', 'Padaria', 'Açougue', 'Hortifruti'] },
  { label: '💊 Saúde', items: ['Farmácia', 'Clínica Médica', 'Clínica Odontológica', 'Laboratório', 'Hospital', 'Ótica'] },
  { label: '💼 Serviços', items: ['Consultoria', 'Contabilidade', 'Advocacia', 'Marketing Digital', 'Agência de Viagens', 'Corretora de Seguros'] },
  { label: '🏭 Indústria', items: ['Indústria Têxtil', 'Metalúrgica', 'Indústria Alimentícia', 'Indústria Química', 'Gráfica'] },
  { label: '💻 Tecnologia', items: ['Software House', 'E-commerce', 'SaaS', 'Startup', 'Telecom'] },
  { label: '🎓 Educação', items: ['Escola', 'Curso de Idiomas', 'Faculdade', 'Centro de Treinamento'] },
  { label: '🌾 Agronegócio', items: ['Loja Agropecuária', 'Cooperativa Agrícola', 'Revenda de Insumos', 'Fazenda'] },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [companyName, setCompanyName] = useState('');
  const [segment, setSegment] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [annualGoal, setAnnualGoal] = useState('');

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const addTeamMember = () => {
    if (!newMemberName.trim()) return;
    
    setTeam([...team, { 
      id: crypto.randomUUID(), 
      name: newMemberName.trim() 
    }]);
    setNewMemberName('');
  };

  const removeTeamMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          segment: segment,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create initial dashboard data
      const numericGoal = parseFloat(annualGoal.replace(/\D/g, '')) || 0;
      const monthlyGoal = numericGoal / 12;

      const teamData = team.map(m => ({
        id: m.id,
        name: m.name,
        avatar: '',
        totalRevenue: 0,
        monthlyGoal: team.length > 0 ? monthlyGoal / team.length : 0,
        active: true,
        totalSalesCount: 0,
        weeks: [],
      }));

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentYear = new Date().getFullYear();
      
      const currentYearData = monthNames.map(month => ({
        month,
        year: currentYear,
        revenue: 0,
        goal: monthlyGoal,
      }));

      const { error: dashError } = await supabase
        .from('dashboard_data')
        .upsert({
          user_id: user.id,
          company_name: companyName,
          business_segment: segment,
          team: teamData,
          current_year_data: currentYearData,
          kpis: {
            annualGoal: numericGoal,
            annualRealized: 0,
          },
          years_available: [currentYear],
        });

      if (dashError) throw dashError;

      await refreshProfile();
      
      toast({
        title: 'Configuração concluída!',
        description: 'Sua conta está pronta para uso.',
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return companyName.trim().length >= 2;
      case 2: return segment.length > 0;
      case 3: return true; // Team is optional
      case 4: return true; // Goal is optional
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Como se chama sua empresa?</h2>
              <p className="text-muted-foreground mt-2">Este nome aparecerá nos relatórios e dashboards</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Label htmlFor="company">Nome da Empresa</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Loja do João"
                className="mt-2 text-lg h-12"
                autoFocus
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 mb-4">
                <Target className="w-8 h-8 text-violet-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Qual o segmento do negócio?</h2>
              <p className="text-muted-foreground mt-2">Isso nos ajuda a personalizar insights e comparações</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Label htmlFor="segment">Segmento</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {segmentCategories.map((category) => (
                    <SelectGroup key={category.label}>
                      <SelectLabel className="text-sm font-semibold text-primary">{category.label}</SelectLabel>
                      {category.items.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Quem faz parte da equipe de vendas?</h2>
              <p className="text-muted-foreground mt-2">Adicione os vendedores (você pode editar depois)</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nome do vendedor"
                  onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
                />
                <Button onClick={addTeamMember} disabled={!newMemberName.trim()}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              
              {team.length > 0 && (
                <div className="space-y-2 mt-4">
                  {team.map((member, idx) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {idx + 1}
                        </span>
                        {member.name}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {team.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhum vendedor adicionado ainda
                </p>
              )}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Qual sua meta anual de faturamento?</h2>
              <p className="text-muted-foreground mt-2">Isso nos ajuda a calcular metas mensais e semanais</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Label htmlFor="goal">Meta Anual (R$)</Label>
              <Input
                id="goal"
                value={annualGoal}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = new Intl.NumberFormat('pt-BR').format(Number(value));
                  setAnnualGoal(formatted);
                }}
                placeholder="Ex: 2.400.000"
                className="mt-2 text-lg h-12"
              />
              {annualGoal && (
                <p className="text-sm text-muted-foreground mt-2">
                  Meta mensal: R$ {new Intl.NumberFormat('pt-BR').format(parseFloat(annualGoal.replace(/\D/g, '')) / 12 || 0)}
                </p>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-border/50">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg text-muted-foreground">
              Configuração Inicial
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Passo {currentStep} de {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        
        <CardContent className="p-8">
          {renderStep()}
          
          <div className="flex justify-between mt-12">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-violet-600"
              >
                {isLoading ? (
                  'Salvando...'
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluir Configuração
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
