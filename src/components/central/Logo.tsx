import React, { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
  customLogoUrl?: string;
  systemName?: string;
}

const Logo: React.FC<LogoProps> = ({ collapsed = false, customLogoUrl, systemName }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Reset error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [customLogoUrl]);

  const showCustomLogo = customLogoUrl && !imageError;
  const displayName = systemName || 'Central Inteligente';

  return (
    <div className="flex items-center gap-3 select-none">
      {showCustomLogo ? (
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-card
          ${isThinking ? 'shadow-[0_0_20px_hsl(var(--primary)/0.6)] scale-105' : 'shadow-md'} transition-all duration-500
        `}>
          <img 
            src={customLogoUrl} 
            alt="Logo" 
            className="w-full h-full object-contain p-1" 
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-xl shadow-md border transition-all duration-500
          grid place-items-center bg-primary
          ${isThinking ? 'shadow-[0_0_20px_hsl(var(--primary)/0.6)] scale-105' : ''}
        `}>
          <Cpu
            size={24}
            strokeWidth={1.5}
            className={`transition-all duration-500 text-primary-foreground ${isThinking ? 'animate-[spin_3s_linear_infinite]' : ''}`}
          />
        </div>
      )}

      {!collapsed && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none whitespace-nowrap tracking-tight text-primary">
            {displayName}
          </span>
          <span
            className={`text-[7px] font-semibold uppercase tracking-[0.25em] text-center leading-tight transition-all duration-300 block mt-1.5 whitespace-nowrap ${
              isThinking ? 'text-primary animate-pulse' : 'text-muted-foreground/70'
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
