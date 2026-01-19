import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMentorshipPhase } from '@/hooks/useMentorshipPhase';

interface PhaseGatedFeatureProps {
  feature: string;
  children: React.ReactNode;
  className?: string;
  showOverlay?: boolean;
  overlayMessage?: string;
  fallback?: React.ReactNode;
  /**
   * For cases where the parent already knows the effective phase (e.g. "view as student"),
   * this bypasses the internal phase check.
   */
  forceUnlocked?: boolean;
}

export const PhaseGatedFeature: React.FC<PhaseGatedFeatureProps> = ({
  feature,
  children,
  className,
  showOverlay = true,
  overlayMessage,
  fallback,
  forceUnlocked,
}) => {
  const { isFeatureUnlocked, getFeatureInfo, currentPhase } = useMentorshipPhase();

  const featureInfo = getFeatureInfo(feature);
  const isUnlocked = forceUnlocked ?? isFeatureUnlocked(feature);

  if (isUnlocked) {
    return <>{children}</>;
  }

  // If feature is locked
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showOverlay) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Render children with reduced opacity */}
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Locked Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
      >
        <div className="text-center p-4 max-w-xs">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          </motion.div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {overlayMessage || featureInfo.message || 'Recurso bloqueado'}
          </p>
          
          {featureInfo.requiredPhase && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Fase {featureInfo.requiredPhase}
            </Badge>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Simpler inline version for menu items, buttons, etc.
interface PhaseGatedWrapperProps {
  feature: string;
  children: React.ReactNode;
  lockedClassName?: string;
  forceUnlocked?: boolean;
}

export const PhaseGatedWrapper: React.FC<PhaseGatedWrapperProps> = ({
  feature,
  children,
  lockedClassName,
  forceUnlocked,
}) => {
  const { isFeatureUnlocked, getFeatureInfo } = useMentorshipPhase();
  const isUnlocked = forceUnlocked ?? isFeatureUnlocked(feature);
  const featureInfo = getFeatureInfo(feature);

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("relative cursor-not-allowed", lockedClassName)}>
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{featureInfo.message}</p>
      </TooltipContent>
    </Tooltip>
  );
};

// Hook-like helper to check phase inline
export const usePhaseGate = (feature: string) => {
  const { isFeatureUnlocked, getFeatureInfo, currentPhase } = useMentorshipPhase();
  
  return {
    isUnlocked: isFeatureUnlocked(feature),
    featureInfo: getFeatureInfo(feature),
    currentPhase
  };
};

export default PhaseGatedFeature;
