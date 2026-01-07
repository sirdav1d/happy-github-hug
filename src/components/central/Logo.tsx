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
          w-12 h-12 flex-shrink-0 rounded-xl shadow-md border transition-all duration-500
          grid place-items-center
          ${isThinking
            ? 'bg-indigo-600 border-cyan-400 shadow-[0_0_20px_hsl(var(--cyan)/0.8)] scale-105'
            : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 border-white/10'
          }
        `}>
          <Cpu
            size={24}
            strokeWidth={1.5}
            className={`transition-all duration-500 ${isThinking ? 'text-cyan-100 animate-[spin_3s_linear_infinite]' : 'text-white'}`}
          />
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
