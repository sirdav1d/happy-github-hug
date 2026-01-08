import { useState } from 'react';
import useAgencyDashboard, { StudentDashboardData } from '@/hooks/useAgencyDashboard';
import { useViewAsStudent } from '@/contexts/ViewAsStudentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  RefreshCw,
  Eye,
  Building2,
  Calendar,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgencyGlobalViewProps {
  onNavigate?: (view: string) => void;
}

export default function AgencyGlobalView({ onNavigate }: AgencyGlobalViewProps) {
  const { students, metrics, isLoading, fetchData } = useAgencyDashboard();
  const { setViewAsStudent } = useViewAsStudent();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'at-risk'>('all');

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filterStatus) {
      case 'active':
        return student.status === 'registered';
      case 'pending':
        return student.status === 'pending';
      case 'at-risk':
        return student.alerts.some(a => a.type === 'danger');
      default:
        return true;
    }
  });

  const handleViewStudent = (student: StudentDashboardData) => {
    if (student.status === 'registered' && student.registeredUserId) {
      setViewAsStudent({
        id: student.registeredUserId,
        email: student.email,
        companyName: student.companyName,
      });
      onNavigate?.('dashboard');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-7 h-7 text-cyan-500" />
            Visão Global
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho de todos os seus mentorados
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchData()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Total Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.studentsOnTrack}</p>
                <p className="text-xs text-muted-foreground">No Caminho</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.studentsAtRisk}</p>
                <p className="text-xs text-muted-foreground">Em Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <TrendingUp className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.averageProgress.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Média Progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Total dos Mentorados</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                {metrics.activeStudents} ativos
              </Badge>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                {metrics.pendingStudents} pendentes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por email ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'pending', 'at-risk'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' && 'Todos'}
              {status === 'active' && 'Ativos'}
              {status === 'pending' && 'Pendentes'}
              {status === 'at-risk' && 'Em Risco'}
            </Button>
          ))}
        </div>
      </div>

      {/* Students Grid */}
      {isLoading && students.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {students.length === 0 
                ? 'Nenhum aluno cadastrado ainda' 
                : 'Nenhum aluno encontrado com essa busca'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard 
              key={student.id}
              student={student}
              onView={() => handleViewStudent(student)}
              formatCurrency={formatCurrency}
              getProgressColor={getProgressColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StudentCardProps {
  student: StudentDashboardData;
  onView: () => void;
  formatCurrency: (value: number) => string;
  getProgressColor: (progress: number) => string;
}

function StudentCard({ student, onView, formatCurrency, getProgressColor }: StudentCardProps) {
  const progress = student.dashboardData?.annualGoal 
    ? (student.dashboardData.annualRealized / student.dashboardData.annualGoal) * 100 
    : 0;

  return (
    <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {student.companyName ? (
              <>
                <CardTitle className="text-base font-semibold truncate flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  {student.companyName}
                </CardTitle>
                <CardDescription className="truncate">{student.email}</CardDescription>
              </>
            ) : (
              <CardTitle className="text-base font-semibold truncate">{student.email}</CardTitle>
            )}
          </div>
          
          {student.status === 'registered' ? (
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shrink-0">
              Ativo
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30 shrink-0">
              <Clock className="w-3 h-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {student.status === 'registered' && student.dashboardData ? (
          <>
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progresso Anual</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(student.dashboardData.annualRealized)}</span>
                <span>Meta: {formatCurrency(student.dashboardData.annualGoal)}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{student.dashboardData.teamSize} vendedores</span>
              </div>
              {student.dashboardData.lastUploadDate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDistanceToNow(new Date(student.dashboardData.lastUploadDate), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}
            </div>
            
            {/* Alerts */}
            {student.alerts.length > 0 && (
              <div className="space-y-1">
                {student.alerts.slice(0, 2).map((alert, idx) => (
                  <div 
                    key={idx}
                    className={`text-xs px-2 py-1 rounded-md ${
                      alert.type === 'danger' 
                        ? 'bg-red-500/10 text-red-400' 
                        : alert.type === 'warning'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            )}
            
            {/* Action */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onView}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Dashboard
              <ArrowUpRight className="w-4 h-4 ml-auto" />
            </Button>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Aguardando cadastro do aluno
          </div>
        )}
      </CardContent>
    </Card>
  );
}
