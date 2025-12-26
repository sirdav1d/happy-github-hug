import React, { useState, useMemo, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar
} from 'recharts';
import {
  TrendingUp, Target, Calendar, DollarSign, CreditCard, Users, Activity, Percent, ShoppingBag, Sparkles, Zap
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import { DashboardData } from '@/types';

interface DashboardViewProps {
  data: DashboardData;
}

const AnimatedCounter = ({ value, formatter, prefix = '' }: { value: number, formatter?: (v: number) => string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime = performance.now();
    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / 2000, 1);
      setCount(value * (1 - Math.pow(1 - progress, 4)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{prefix}{formatter ? formatter(count) : Math.round(count)}</span>;
};

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const [period, setPeriod] = useState<'annual' | 'semester' | 'quarter' | 'monthly'>('monthly');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const getCurrentMonthMetrics = () => {
    const validMonths = data.currentYearData.filter(d => d.revenue > 0);
    return validMonths.length > 0 ? validMonths[validMonths.length - 1] : { revenue: 0, goal: 0, month: 'Jan' };
  };

  const currentMonthData = getCurrentMonthMetrics();
  const currentMonthPercent = currentMonthData.goal > 0 ? (currentMonthData.revenue / currentMonthData.goal) * 100 : 0;

  const runRateData = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const effectiveDay = (currentMonthData.revenue > 0) ? Math.min(dayOfMonth, totalDays) : 20;
    const dailyAvg = currentMonthData.revenue / effectiveDay;
    const projection = dailyAvg * totalDays;
    const status = projection >= currentMonthData.goal ? 'on_track' : 'below';
    const gap = currentMonthData.goal - projection;

    return { projection, status, gap, dailyAvg };
  }, [currentMonthData]);

  // Derivar anos dinamicamente dos dados disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.historicalData.forEach(d => years.add(d.year));
    data.currentYearData.forEach(d => years.add(d.year));
    if (data.yearsAvailable) {
      data.yearsAvailable.forEach(y => years.add(y));
    }
    return Array.from(years).sort();
  }, [data]);

  // Determinar o ano selecionado e o ano anterior
  const selectedYear = useMemo(() => {
    if (data.currentYearData.length > 0) {
      return data.currentYearData[0].year;
    }
    return new Date().getFullYear();
  }, [data]);

  const lastYear = selectedYear - 1;

  const chartData = useMemo(() => {
    switch (period) {
      case 'annual':
        // Usar anos disponíveis dinamicamente
        return availableYears.map(year => {
          const isCurrentYear = year === selectedYear;
          const yearData = isCurrentYear 
            ? data.currentYearData 
            : data.historicalData.filter(d => d.year === year);
          
          const totalRevenue = yearData.reduce((acc, curr) => acc + curr.revenue, 0);
          const totalGoal = yearData.reduce((acc, curr) => acc + curr.goal, 0);
          
          return { 
            name: year.toString(), 
            revenue: totalRevenue, 
            goal: totalGoal > 0 ? totalGoal : totalRevenue * 1.1 
          };
        });
      default:
        return data.currentYearData.map(d => {
          // Usar lastYear dinâmico em vez de hardcoded 2024
          const lastYearMonth = data.historicalData.find(h => h.year === lastYear && h.month === d.month);
          return { name: d.month, revenue: d.revenue, goal: d.goal, lastYear: lastYearMonth?.revenue || 0 };
        });
    }
  }, [period, data, availableYears, selectedYear, lastYear]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Meta Anual */}
        <div className="bg-card backdrop-blur-md p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:border-cyan-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meta Anual</p>
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                <AnimatedCounter value={data.kpis.annualGoal} formatter={formatCurrency} />
              </h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary border border-transparent group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Progresso</span>
              <AnimatedCounter value={(data.kpis.annualRealized/data.kpis.annualGoal)*100} formatter={(v) => v.toFixed(1) + '%'} />
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full transition-all duration-1000 bg-cyan-500" style={{ width: `${Math.min((data.kpis.annualRealized/data.kpis.annualGoal)*100, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Acumulado Ano */}
        <div className="bg-card backdrop-blur-md p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:border-green-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acumulado Ano</p>
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                <AnimatedCounter value={data.kpis.annualRealized} formatter={formatCurrency} />
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl text-green-600 dark:text-green-400 border border-transparent group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
              <TrendingUp size={14} />{data.kpis.lastYearGrowth >= 0 ? '+' : ''}<AnimatedCounter value={data.kpis.lastYearGrowth} formatter={(v) => v.toFixed(1)} />%
            </span>
            <span className="text-xs text-muted-foreground">vs {lastYear}</span>
          </div>
        </div>

        {/* Run Rate */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700 blur-2xl"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Run Rate {currentMonthData.month}</p>
              <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(runRateData.projection)}</h3>
            </div>
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-500 border border-amber-500/30 animate-pulse">
              <Zap size={20} fill="currentColor" />
            </div>
          </div>
          <div className="mt-6 z-10">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
              <span>Projeção vs Meta</span>
              <span>{((runRateData.projection/currentMonthData.goal)*100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div className="h-full bg-amber-500" style={{ width: `${Math.min((runRateData.projection/currentMonthData.goal)*100, 100)}%` }}></div>
            </div>
            <p className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${runRateData.status === 'on_track' ? 'text-green-400' : 'text-amber-400'}`}>
              {runRateData.status === 'on_track' ? 'No caminho da meta 🚀' : `Faltam ${formatCurrency(runRateData.gap)} p/ meta`}
            </p>
          </div>
        </div>

        {/* Fechamento Mensal */}
        <div className="bg-card backdrop-blur-md p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:border-orange-500/30 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Fechamento Mensal
                <span className="text-[9px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/20">
                  {data.kpis.currentMonthName.substring(0, 3).toUpperCase()}
                </span>
              </p>
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                <AnimatedCounter value={currentMonthData.revenue} formatter={formatCurrency} />
              </h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 border border-transparent group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Meta: {formatCurrency(currentMonthData.goal)}</span>
              <span>{currentMonthPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.min(currentMonthPercent, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Eficiência Operacional */}
      <div>
        <h4 className="text-sm font-bold text-muted-foreground mb-4 px-1 flex items-center gap-2 uppercase tracking-widest">
          Eficiência Operacional
          <InfoTooltip text="Métricas baseadas em Qtd Vendas, Novos Clientes e Investimento Mkt." />
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Médio</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              <AnimatedCounter value={data.kpis.averageTicket} formatter={formatCurrency} />
            </span>
          </div>
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Conversão</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              <AnimatedCounter value={data.kpis.conversionRate} formatter={(v) => v.toFixed(1)} />%
            </span>
          </div>
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">CAC</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              <AnimatedCounter value={data.kpis.cac} formatter={formatCurrency} />
            </span>
          </div>
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">LTV Estimado</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              <AnimatedCounter value={data.kpis.ltv} formatter={formatCurrency} />
            </span>
          </div>
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingBag size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Vendas Totais</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              <AnimatedCounter value={data.kpis.totalSalesCount} formatter={(v) => Math.round(v).toString()} />
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-border relative overflow-hidden flex flex-col min-h-[340px] justify-between">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 z-10">
            <div>
              <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} />
                Performance de Vendas
              </h4>
              <p className="text-xs text-muted-foreground">Meta (Barras) vs Realizado (Linha)</p>
            </div>
            <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border border-border">
              {[{id:'monthly',label:'Mensal'},{id:'annual',label:'Anual'}].map(p=>(
                <button 
                  key={p.id} 
                  onClick={()=>setPeriod(p.id as any)} 
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period===p.id?'bg-card text-primary shadow-sm':'text-muted-foreground'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-60 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{top:10,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="dark:opacity-10" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill:'#94a3b8',fontSize:10}} dy={10} />
                <YAxis tickFormatter={(val)=>`${val/1000}k`} tickLine={false} axisLine={false} tick={{fill:'#94a3b8',fontSize:10}} />
                <Tooltip cursor={{fill:'transparent'}} />
                <Bar dataKey="goal" fill="#f1f5f9" className="dark:fill-slate-700" radius={[4,4,0,0]} />
                <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={3} fillOpacity={0.2} fill="#22d3ee" activeDot={{r:6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl shadow-xl text-white flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform border border-white/5 min-h-[340px]">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-cyan-400 animate-pulse" size={20} />
              Resumo Inteligente
            </h4>
            <p className="text-slate-300 leading-relaxed text-sm border-l-2 border-cyan-500 pl-4 my-auto">
              A projeção para o fim de {currentMonthData.month} é de <strong className="text-cyan-300">{formatCurrency(runRateData.projection)}</strong>. 
              {runRateData.status === 'on_track' 
                ? ' Continue nesse ritmo para superar a meta!' 
                : ' Precisamos acelerar o fechamento de propostas para recuperar o faturamento.'}
              <br/><br/>
              O crescimento médio é de {data.kpis.lastYearGrowth.toFixed(1)}%.
            </p>
            <button 
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold py-3 px-6 rounded-xl hover:bg-cyan-500/20 transition-all shadow-lg self-end flex items-center justify-center gap-2 text-xs mt-4 uppercase" 
              onClick={()=>document.dispatchEvent(new CustomEvent('changeTab',{detail:'ai-summary'}))}
            >
              Ver Relatório Completo <Target size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
