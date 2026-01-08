import { useEffect, useState } from 'react';

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

  // If custom system name, use different display
  if (systemName && systemName !== 'Central Inteligente') {
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
        ) : null}
        {!collapsed && (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none whitespace-nowrap tracking-tight bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {systemName}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 select-none">
      {showCustomLogo && (
        <div className={`
          w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-card
          ${isThinking ? 'shadow-[0_0_20px_hsl(var(--primary)/0.6)] scale-105' : 'shadow-md'} transition-all duration-500
        `}>
          <img 
            src={customLogoUrl} 
            alt="Logo" 
            className="w-full h-full object-contain p-1" 
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {!collapsed && (
        <div className="flex flex-col items-start">
          {/* Main logo text: CENTRAL.IA */}
          <div className="flex items-baseline">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CENTRAL
            </span>
            <span 
              className={`text-2xl font-black text-accent transition-all duration-300 ${
                isThinking ? 'animate-pulse scale-125' : ''
              }`}
            >
              .
            </span>
            <span className="text-2xl font-black tracking-tight text-foreground/90">
              IA
            </span>
          </div>
          
          {/* Subtitle */}
          <span
            className={`text-[7px] font-semibold uppercase tracking-[0.25em] leading-tight transition-all duration-300 whitespace-nowrap ${
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
