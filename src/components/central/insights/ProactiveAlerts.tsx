import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Flame, Lightbulb, ArrowRight, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProactiveAlert } from '@/hooks/useIRISCommandCenter';

interface ProactiveAlertsProps {
  alerts: ProactiveAlert[];
  onNavigate: (view: string) => void;
}

const alertTypeConfig = {
  urgent: {
    icon: AlertTriangle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    iconColor: 'text-red-500',
    badge: 'bg-red-500 text-white',
    badgeLabel: 'Urgente',
  },
  warning: {
    icon: Flame,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500 text-white',
    badgeLabel: 'Atenção',
  },
  opportunity: {
    icon: Lightbulb,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-500',
    badge: 'bg-emerald-500 text-white',
    badgeLabel: 'Oportunidade',
  },
};

const ProactiveAlerts = ({ alerts, onNavigate }: ProactiveAlertsProps) => {
  if (alerts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum alerta no momento</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            IRIS monitora seu negócio em tempo real
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-violet-500" />
          Alertas Proativos
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {alerts.length} alerta(s)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, index) => {
            const config = alertTypeConfig[alert.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  config.bg,
                  config.border,
                  "hover:bg-opacity-20 cursor-pointer"
                )}
                onClick={() => alert.actionView && onNavigate(alert.actionView)}
              >
                <div className={cn("p-1.5 rounded-md", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground">
                      {alert.title}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      config.badge
                    )}>
                      {config.badgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>

                {alert.actionView && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ProactiveAlerts;
