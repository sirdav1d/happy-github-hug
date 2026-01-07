import React, { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
  customLogoUrl?: string;
}

const Logo: React.FC<LogoProps> = ({ collapsed = false, customLogoUrl }) => {
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const startThinking = () => setIsThinking(true);
    const stopThinking = () => setIsThinking(false);

    document.addEventListener('nova-start-thinking', startThinking);
    document.addEventListener('nova-stop-thinking', stopThinking);

    return () => {
      document.removeEventListener('nova-start-thinking', startThinking);
      document.removeEventListener('nova-stop-thinking', stopThinking);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 select-none">
      {customLogoUrl ? (
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-card
          ${isThinking ? 'shadow-[0_0_20px_hsl(var(--cyan)/0.8)] scale-105' : 'shadow-md'} transition-all duration-500
        `}>
          <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
        </div>
      ) : (
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-xl shadow-lg transition-all duration-500
          grid place-items-center relative overflow-hidden
          bg-white/10 dark:bg-white/5 backdrop-blur-md
          border border-transparent
          ${isThinking
            ? 'shadow-[0_0_25px_hsl(var(--cyan)/0.6)] scale-105'
            : ''
          }
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          borderImage: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(6,182,212,0.5)) 1',
        }}
        >
          <div className="absolute inset-0 rounded-xl border border-gradient-to-br from-indigo-500/30 via-blue-500/20 to-cyan-500/30 pointer-events-none" 
               style={{ 
                 background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.1) 100%)',
                 borderRadius: 'inherit'
               }} 
          />
          <Cpu
            size={24}
            strokeWidth={1.5}
            className={`relative z-10 transition-all duration-500 ${
              isThinking 
                ? 'text-cyan-400 animate-[spin_3s_linear_infinite] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                : 'text-transparent bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 bg-clip-text drop-shadow-sm'
            }`}
            style={!isThinking ? { stroke: 'url(#iconGradient)' } : undefined}
          />
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {!collapsed && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none whitespace-nowrap tracking-tight bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Central Inteligente
          </span>
          <span
            className={`text-[7px] font-semibold uppercase tracking-[0.25em] text-center leading-tight transition-all duration-300 block mt-1.5 whitespace-nowrap ${
              isThinking ? 'text-cyan-500 dark:text-cyan-400 animate-pulse' : 'text-muted-foreground/70'
            }`}
          >
            {isThinking ? 'Processando IA...' : 'Mentorship Intelligence'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
