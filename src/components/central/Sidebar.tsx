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
  Target,
  UserPlus,
  PenTool,
  Globe
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
    { id: 'input-center', label: 'Lançamentos', icon: <PenTool size={20} strokeWidth={1.5} className="text-emerald-500" /> },
    { id: 'seasonality', label: 'Planejamento & Metas', icon: <Target size={20} strokeWidth={1.5} /> },
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

        <button
          onClick={onOpenUpload}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-foreground hover:bg-card border border-dashed border-border hover:border-primary hover:text-primary transition-all shadow-sm group bg-card/50 hover:shadow-lg"
        >
          <div className="p-1.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Upload size={16} strokeWidth={2} />
          </div>
          <span>Upload Planilha</span>
        </button>

        <p className="text-[9px] text-muted-foreground/50 text-center pt-1 font-mono">v2.0 • CI</p>
      </div>
    </aside>
  );
};

export default Sidebar;
