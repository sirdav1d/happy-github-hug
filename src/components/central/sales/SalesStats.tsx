import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Users, ShoppingCart, Target, UserPlus, PhoneCall, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sale } from '@/types/sales';

interface SalesStatsProps {
  sales: Sale[];
  periodLabel: string;
}

const SalesStats: React.FC<SalesStatsProps> = ({ sales, periodLabel }) => {
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
    // Sum sales_count for accurate total sales (handles batch entries)
    const totalSalesCount = sales.reduce((sum, s) => sum + Number(s.sales_count || 1), 0);
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const newClients = sales.filter(s => s.is_new_client).length;
    const totalCAC = sales
      .filter(s => s.is_new_client)
      .reduce((sum, s) => sum + Number(s.acquisition_cost || 0), 0);
    const avgCAC = newClients > 0 ? totalCAC / newClients : 0;

    // Total attendances
    const totalAttendances = sales.reduce((sum, s) => sum + Number(s.attendances || 0), 0);
    
    // Conversion rate based on attendances
    const conversionRate = totalAttendances > 0 
      ? (totalSalesCount / totalAttendances) * 100 
      : 0;

    // Vendedores únicos
    const uniqueSalespeople = new Set(sales.map(s => s.salesperson_id)).size;

    // Canal breakdown
    const onlineSales = sales.filter(s => s.channel === 'online');
    const presencialSales = sales.filter(s => s.channel === 'presencial');
    const onlineRevenue = onlineSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const presencialRevenue = presencialSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const onlineSalesCount = onlineSales.reduce((sum, s) => sum + Number(s.sales_count || 1), 0);
    const presencialSalesCount = presencialSales.reduce((sum, s) => sum + Number(s.sales_count || 1), 0);

    return {
      totalRevenue,
      totalSalesCount,
      averageTicket,
      newClients,
      avgCAC,
      totalAttendances,
      conversionRate,
      uniqueSalespeople,
      onlineRevenue,
      presencialRevenue,
      onlineSalesCount,
      presencialSalesCount,
    };
  }, [sales]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const statCards = [
    {
      label: 'Faturamento',
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign size={20} />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Vendas',
      value: stats.totalSalesCount.toString(),
      icon: <ShoppingCart size={20} />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Atendimentos',
      value: stats.totalAttendances.toString(),
      icon: <PhoneCall size={20} />,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Conversão',
      value: stats.totalAttendances > 0 ? `${stats.conversionRate.toFixed(1)}%` : '-',
      icon: <Percent size={20} />,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(stats.averageTicket),
      icon: <Target size={20} />,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Novos Clientes',
      value: stats.newClients.toString(),
      icon: <UserPlus size={20} />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'CAC Médio',
      value: formatCurrency(stats.avgCAC),
      icon: <TrendingUp size={20} />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Vendedores Ativos',
      value: stats.uniqueSalespeople.toString(),
      icon: <Users size={20} />,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Resumo {periodLabel}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="p-4 border-border/50 bg-card/50 hover:bg-card transition-colors"
          >
            <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-2`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Channel breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 border-border/50 bg-gradient-to-br from-violet-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Presencial</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.presencialRevenue)}</p>
              <p className="text-xs text-muted-foreground">{stats.presencialSalesCount} vendas</p>
            </div>
            <div className="text-3xl font-bold text-violet-500/20">
              {stats.totalSalesCount > 0 
                ? Math.round((stats.presencialSalesCount / stats.totalSalesCount) * 100) 
                : 0}%
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-gradient-to-br from-cyan-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Online</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.onlineRevenue)}</p>
              <p className="text-xs text-muted-foreground">{stats.onlineSalesCount} vendas</p>
            </div>
            <div className="text-3xl font-bold text-cyan-500/20">
              {stats.totalSalesCount > 0 
                ? Math.round((stats.onlineSalesCount / stats.totalSalesCount) * 100) 
                : 0}%
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SalesStats;
