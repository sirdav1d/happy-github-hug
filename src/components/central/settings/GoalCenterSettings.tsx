import React from 'react';
import { Target } from 'lucide-react';
import { AnnualGoalsSettings } from './AnnualGoalsSettings';

export const GoalCenterSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7 text-primary" />
          Central de Metas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure suas metas anuais. As metas individuais são calculadas automaticamente dividindo a meta anual pelos vendedores ativos.
        </p>
      </div>

      {/* Annual Goals Settings */}
      <AnnualGoalsSettings showHeader={false} />
    </div>
  );
};

export default GoalCenterSettings;
