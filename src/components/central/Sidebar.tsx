import React from 'react';
import { ViewState, UserRole, DashboardData } from '@/types';
import Logo from './Logo';
import NotificationCenter from './NotificationCenter';
import { Separator } from '@/components/ui/separator';
import { useMentorshipPhase } from '@/hooks/useMentorshipPhase';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  Upload,
  BarChart3,
  Lightbulb,
  BookOpen,
  Settings,
  Moon,
  Sun,
  UserPlus,
  PenTool,
  Globe,
  CalendarDays,
  Trophy,
  MessageSquare,
  ClipboardList,
  Filter,
  Target,
  Brain,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenUpload: () => void;
  userRole?: UserRole;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  customLogoUrl?: string;
  isOpen?: boolean;
  onClose?: () => void;
  dashboardData?: DashboardData;
}

interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ElementType;
  consultantOnly?: boolean;
  iconClass?: string;
  subtitle?: string;
  isPremium?: boolean;
  requiresBehavioralAccess?: boolean;
}

interface Section {
  label: string;
  showSeparator?: boolean;
  consultantOnly?: boolean;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  onOpenUpload,
  userRole = 'consultant',
  isDarkMode,
  onToggleTheme,
  customLogoUrl,
  isOpen = true,
  onClose,
  dashboardData
}) => {
  const { user } = useAuth();
  const { hasBehavioralAccess } = useMentorshipPhase();
  const isConsultant = userRole === 'consultant';

  const sections: Section[] = [
    {
      label: 'Análise',
      items: [
        { id: 'agency-global', label: 'Visão Global', icon: Globe, consultantOnly: true, iconClass: 'text-cyan-500' },
        { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'seasonality', label: 'Sazonalidade', icon: CalendarDays },
        { id: 'team', label: 'Equipe', icon: Users },
      ]
    },
    {
      label: 'Vendas',
      showSeparator: true,
      items: [
        { id: 'pipeline', label: 'Pipeline', icon: Filter, iconClass: 'text-indigo-500' },
        { id: 'input-center', label: 'Lançamentos', icon: PenTool, iconClass: 'text-emerald-500' },
        { id: 'salespeople', label: 'Vendedores', icon: UserCog, iconClass: 'text-blue-500' },
      ]
    },
    {
      label: 'Rituais',
      showSeparator: true,
      items: [
        { id: 'rmr', label: 'RMR', icon: Trophy, iconClass: 'text-amber-500' },
        { id: 'pgv', label: 'PGV Semanal', icon: ClipboardList, iconClass: 'text-emerald-500' },
        { id: 'fivi', label: 'FIV', icon: MessageSquare, iconClass: 'text-violet-500' },
      ]
    },
    {
      label: 'Inteligência',
      showSeparator: true,
      items: [
        { id: 'insights', label: 'Insights', icon: Lightbulb },
        { 
          id: 'behavioral', 
          label: 'Análise Comportamental', 
          icon: Brain, 
          subtitle: 'by Innermetrix',
          isPremium: true,
          requiresBehavioralAccess: true
        },
        { id: 'ai-summary', label: 'Sumário Executivo', icon: FileText },
        { id: 'glossary', label: 'Glossário', icon: BookOpen },
      ]
    },
    {
      label: 'Gestão',
      showSeparator: true,
      consultantOnly: true,
      items: [
        { id: 'admin-users', label: 'Gestão de Alunos', icon: UserPlus, consultantOnly: true },
        { id: 'video-library', label: 'Biblioteca de Vídeos', icon: BarChart3, consultantOnly: true, iconClass: 'text-rose-500' },
      ]
    },
    {
      label: 'Conta',
      showSeparator: true,
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings },
        { id: 'goal-center', label: 'Central de Metas', icon: Target, iconClass: 'text-primary' },
      ]
    }
  ];

  const handleNavClick = (view: ViewState) => {
    onChangeView(view);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        w-64 bg-card/95 backdrop-blur-xl border-r border-border h-screen fixed left-0 top-0 flex flex-col z-50 no-print shadow-2xl transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Logo customLogoUrl={customLogoUrl} />
          <div className="flex items-center gap-1">
            <div className="hidden md:block">
              <NotificationCenter 
                dashboardData={dashboardData}
                onNavigate={onChangeView}
              />
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="md:hidden p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </div>

      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        {sections.map((section, sectionIdx) => {
          const visibleItems = section.items.filter(item => 
            !(userRole === 'business_owner' && item.consultantOnly)
          );
          
          if (visibleItems.length === 0) return null;
          if (section.consultantOnly && userRole === 'business_owner') return null;

          return (
            <div key={section.label} className={sectionIdx > 0 ? 'mt-6' : ''}>
              {section.showSeparator && (
                <Separator className="mb-4 bg-border/50" />
              )}
              
              <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.label}
              </p>
              
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const isPremiumItem = item.isPremium;
                  
                  // Check if this item requires behavioral access
                  const needsBehavioralAccess = item.requiresBehavioralAccess && !isConsultant;
                  const hasBehavioralPermission = needsBehavioralAccess ? hasBehavioralAccess(user?.id) : true;
                  const isLocked = needsBehavioralAccess && !hasBehavioralPermission;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                        isLocked
                          ? 'text-muted-foreground/50 cursor-default'
                          : isPremiumItem
                            ? isActive
                              ? 'bg-gradient-to-r from-fuchsia-500/15 to-violet-500/15 text-fuchsia-400 shadow-[0_0_20px_hsl(292_84%_61%/0.2)]'
                              : 'text-muted-foreground hover:bg-gradient-to-r hover:from-fuchsia-500/10 hover:to-violet-500/10 hover:text-fuchsia-300'
                            : isActive
                              ? 'bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)]'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {isActive && !isLocked && (
                        <div className={`absolute inset-y-0 left-0 w-1 rounded-r-full shadow-[0_0_10px_currentColor] ${
                          isPremiumItem ? 'bg-gradient-to-b from-fuchsia-500 to-violet-500' : 'bg-primary'
                        }`}></div>
                      )}

                      {isLocked ? (
                        <Lock 
                          size={18} 
                          strokeWidth={1.5} 
                          className="text-muted-foreground/40"
                        />
                      ) : (
                        <Icon 
                          size={18} 
                          strokeWidth={1.5} 
                          className={
                            isPremiumItem 
                              ? isActive ? 'text-fuchsia-400' : 'text-fuchsia-400/60 group-hover:text-fuchsia-400'
                              : item.iconClass || (isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')
                          }
                        />
                      )}
                      <div className="flex flex-col items-start">
                        <span className={isLocked ? 'text-muted-foreground/50' : ''}>{item.label}</span>
                        {item.subtitle && (
                          <span className={`text-[9px] font-normal tracking-wide ${
                            isLocked 
                              ? 'text-muted-foreground/30'
                              : isPremiumItem 
                                ? 'text-fuchsia-400/50' 
                                : 'text-muted-foreground/50'
                          }`}>
                            {isLocked ? 'Acesso bloqueado' : item.subtitle}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border bg-muted/30 space-y-3">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-card border border-transparent hover:border-border transition-all"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
            </span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-muted'}`}>
              <div className={`w-3 h-3 bg-card rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>
        )}

        <button
          onClick={() => { onOpenUpload(); onClose?.(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-dashed border-border hover:border-primary transition-all group"
        >
          <Upload size={14} strokeWidth={2} className="group-hover:text-primary" />
          <span>Upload Planilha</span>
        </button>

        <p className="text-[9px] text-muted-foreground/50 text-center pt-1 font-mono">v2.0 • CI</p>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
