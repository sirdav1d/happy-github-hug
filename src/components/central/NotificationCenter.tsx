import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trophy, Filter, Target, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification, NotificationType, NotificationPriority } from '@/hooks/useNotifications';
import { DashboardData, ViewState } from '@/types';

interface NotificationCenterProps {
  dashboardData?: DashboardData;
  onNavigate?: (view: ViewState) => void;
}

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  ritual: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  lead: { icon: Filter, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  goal: { icon: Target, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const priorityConfig: Record<NotificationPriority, { border: string; badge: string }> = {
  high: { border: 'border-l-rose-500', badge: 'bg-rose-500/10 text-rose-500' },
  medium: { border: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-500' },
  low: { border: 'border-l-muted', badge: 'bg-muted text-muted-foreground' },
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ dashboardData, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, totalCount, highPriorityCount } = useNotifications(dashboardData);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action && onNavigate) {
      onNavigate(notification.action.view as ViewState);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9"
      >
        <Bell size={20} className={totalCount > 0 ? 'text-foreground' : 'text-muted-foreground'} />
        {totalCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 ${
            highPriorityCount > 0 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-primary text-primary-foreground'
          }`}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[340px] md:w-[380px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-primary" />
                  <span className="font-semibold text-foreground">Notificações</span>
                  {totalCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {totalCount}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Notifications List */}
              <ScrollArea className="max-h-[400px]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Bell size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
                    <p className="text-xs text-muted-foreground mt-1">Nenhuma pendência no momento</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification, idx) => {
                      const typeStyle = typeConfig[notification.type];
                      const priorityStyle = priorityConfig[notification.priority];
                      const Icon = typeStyle.icon;

                      return (
                        <motion.button
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-4 hover:bg-muted/50 transition-colors border-l-4 ${priorityStyle.border} group`}
                        >
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg ${typeStyle.bg} flex-shrink-0`}>
                              <Icon size={16} className={typeStyle.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {notification.title}
                                </p>
                                {notification.priority === 'high' && (
                                  <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.description}
                              </p>
                              {notification.action && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>{notification.action.label}</span>
                                  <ChevronRight size={12} />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-border bg-muted/30">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {highPriorityCount > 0 
                      ? `${highPriorityCount} alerta${highPriorityCount > 1 ? 's' : ''} de alta prioridade`
                      : 'Clique em uma notificação para agir'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
