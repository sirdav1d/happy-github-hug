import React from 'react';
import { ViewState, UserRole } from '@/types';
import Logo from './Logo';
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
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenUpload: () => void;
  userRole?: UserRole;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  customLogoUrl?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  onOpenUpload,
  userRole = 'consultant',
  isDarkMode,
  onToggleTheme,
  customLogoUrl
}) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode; consultantOnly?: boolean }[] = [
    { id: 'agency-global', label: 'Visão Global Agência', icon: <Globe size={20} strokeWidth={1.5} className="text-cyan-500" />, consultantOnly: true },
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
    { id: 'seasonality', label: 'Sazonalidade', icon: <CalendarDays size={20} strokeWidth={1.5} /> },
    { id: 'team', label: 'Equipe', icon: <Users size={20} strokeWidth={1.5} /> },
    { id: 'pgv', label: 'PGV Semanal', icon: <BarChart3 size={20} strokeWidth={1.5} /> },
    { id: 'insights', label: 'Insights', icon: <Lightbulb size={20} strokeWidth={1.5} /> },
    { id: 'ai-summary', label: 'Sumário Executivo', icon: <FileText size={20} strokeWidth={1.5} /> },
    { id: 'glossary', label: 'Glossário', icon: <BookOpen size={20} strokeWidth={1.5} /> },
    { id: 'admin-users', label: 'Gestão de Alunos', icon: <UserPlus size={20} strokeWidth={1.5} />, consultantOnly: true },
    { id: 'settings', label: 'Configurações', icon: <Settings size={20} strokeWidth={1.5} />, consultantOnly: true },
  ];

  const visibleItems = navItems.filter(item => {
    if (userRole === 'business_owner' && item.consultantOnly) {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 bg-card/80 backdrop-blur-xl border-r border-border h-screen fixed left-0 top-0 flex flex-col z-10 no-print shadow-2xl transition-colors duration-300">
      <div className="p-6 border-b border-border">
        <Logo customLogoUrl={customLogoUrl} />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
              currentView === item.id
                ? 'bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)]'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {currentView === item.id && (
              <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_currentColor]"></div>
            )}

            <span className={`transition-colors duration-200 ${currentView === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
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

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChangeView('input-center')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              currentView === 'input-center'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border hover:border-emerald-500/50'
            }`}
          >
            <PenTool size={14} strokeWidth={2} className={currentView === 'input-center' ? 'text-emerald-500' : 'group-hover:text-emerald-500'} />
            <span>Lançamentos</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-dashed border-border hover:border-primary transition-all group"
          >
            <Upload size={14} strokeWidth={2} className="group-hover:text-primary" />
            <span>Upload</span>
          </button>
        </div>

        <p className="text-[9px] text-muted-foreground/50 text-center pt-1 font-mono">v2.0 • CI</p>
      </div>
    </aside>
  );
};

export default Sidebar;
