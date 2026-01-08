import { useMemo, useState } from 'react';
import { StudentDashboardData } from '@/hooks/useAgencyDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Crown, Award } from 'lucide-react';

interface StudentRankingProps {
  students: StudentDashboardData[];
}

type SortMetric = 'progress' | 'revenue' | 'monthlyProgress';

export default function StudentRanking({ students }: StudentRankingProps) {
  const [sortMetric, setSortMetric] = useState<SortMetric>('progress');

  const rankedStudents = useMemo(() => {
    const activeStudents = students.filter(s => 
      (s.status === 'registered' || s.status === 'demo') && s.dashboardData
    );

    return activeStudents
      .map(student => {
        const data = student.dashboardData!;
        const annualProgress = data.annualGoal > 0 
          ? (data.annualRealized / data.annualGoal) * 100 
          : 0;
        const monthlyProgress = data.currentMonthGoal > 0
          ? (data.currentMonthRevenue / data.currentMonthGoal) * 100
          : 0;

        return {
          ...student,
          annualProgress,
          monthlyProgress,
          revenue: data.annualRealized,
        };
      })
      .sort((a, b) => {
        switch (sortMetric) {
          case 'revenue':
            return b.revenue - a.revenue;
          case 'monthlyProgress':
            return b.monthlyProgress - a.monthlyProgress;
          default:
            return b.annualProgress - a.annualProgress;
        }
      });
  }, [students, sortMetric]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{position + 1}</span>;
    }
  };

  const getRankBadgeClass = (position: number) => {
    switch (position) {
      case 0:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 1:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 2:
        return 'bg-amber-600/20 text-amber-500 border-amber-600/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTrendIcon = (progress: number) => {
    if (progress >= 100) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (progress >= 70) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (rankedStudents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Nenhum aluno ativo com dados para ranking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking de Performance
          </CardTitle>
          <Select value={sortMetric} onValueChange={(v) => setSortMetric(v as SortMetric)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">Progresso Anual</SelectItem>
              <SelectItem value="revenue">Faturamento</SelectItem>
              <SelectItem value="monthlyProgress">Progresso Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rankedStudents.map((student, index) => {
          const displayProgress = sortMetric === 'monthlyProgress' 
            ? student.monthlyProgress 
            : student.annualProgress;

          return (
            <div
              key={student.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                index < 3 
                  ? 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/10' 
                  : 'hover:bg-muted/50'
              }`}
            >
              {/* Rank Badge */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRankBadgeClass(index)}`}>
                {getRankIcon(index)}
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {student.companyName || student.email}
                  </p>
                  {index === 0 && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-xs">
                      Líder
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <Progress 
                    value={Math.min(displayProgress, 100)} 
                    className="h-2 flex-1 max-w-[200px]"
                  />
                  <span className="text-sm font-medium text-foreground min-w-[50px]">
                    {displayProgress.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(student.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Faturado</p>
                </div>
                <div className="flex items-center">
                  {getTrendIcon(student.annualProgress)}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
