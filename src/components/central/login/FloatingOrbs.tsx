import { useMemo } from 'react';

const FloatingOrbs = () => {
  // Detect Firefox to use lighter blur effects
  const isFirefox = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);

  // Reduce blur intensity for Firefox to prevent performance issues
  const blurLarge = isFirefox ? 30 : 60;
  const blurMedium = isFirefox ? 25 : 50;
  const blurSmall = isFirefox ? 20 : 40;
  const blurTiny = isFirefox ? 15 : 30;
  const blurBottom = isFirefox ? 40 : 80;

  // Reduce opacity slightly for Firefox
  const opacityMultiplier = isFirefox ? 0.7 : 1;

  // Firefox: disable orbs completely to prevent black screen
  if (isFirefox) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large cyan orb - top right */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full animate-float-slow"
        style={{
          opacity: 0.30 * opacityMultiplier,
          background: 'radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.4), rgba(34, 211, 238, 0.1) 50%, transparent 70%)',
          filter: `blur(${blurLarge}px)`,
        }}
      />
      
      {/* Medium indigo orb - left center */}
      <div 
        className="absolute top-1/3 -left-24 w-72 h-72 rounded-full animate-float-medium"
        style={{
          opacity: 0.40 * opacityMultiplier,
          background: 'radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.5), rgba(99, 102, 241, 0.1) 50%, transparent 70%)',
          filter: `blur(${blurMedium}px)`,
        }}
      />
      
      {/* Small purple orb - bottom center */}
      <div 
        className="absolute bottom-20 left-1/3 w-48 h-48 rounded-full animate-float-fast"
        style={{
          opacity: 0.35 * opacityMultiplier,
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.1) 50%, transparent 70%)',
          filter: `blur(${blurSmall}px)`,
        }}
      />
      
      {/* Tiny blue orb - right center */}
      <div 
        className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full animate-float-medium"
        style={{
          opacity: 0.50 * opacityMultiplier,
          background: 'radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
          filter: `blur(${blurTiny}px)`,
          animationDelay: '2s',
        }}
      />

      {/* Extra glow at bottom */}
      <div 
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-40"
        style={{
          opacity: 0.20 * opacityMultiplier,
          background: 'linear-gradient(to top, rgba(34, 211, 238, 0.3), transparent)',
          filter: `blur(${blurBottom}px)`,
        }}
      />
    </div>
  );
};

export default FloatingOrbs;
