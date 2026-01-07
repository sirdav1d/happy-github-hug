import React from 'react';
import { ViewState, UserRole } from '@/types';
import Logo from './Logo';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
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
  Filter
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
}

interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ElementType;
  consultantOnly?: boolean;
  iconClass?: string;
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
  onClose
}) => {
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
        { id: 'settings', label: 'Configurações', icon: Settings, consultantOnly: true },
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
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
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
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                        isActive
                          ? 'bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)]'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_currentColor]"></div>
                      )}

                      <Icon 
                        size={18} 
                        strokeWidth={1.5} 
                        className={item.iconClass || (isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
                      />
                      <span>{item.label}</span>
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
