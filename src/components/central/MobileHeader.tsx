import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import NotificationCenter from './NotificationCenter';
import { DashboardData, ViewState } from '@/types';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  customLogoUrl?: string;
  dashboardData?: DashboardData;
  onNavigate?: (view: ViewState) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  onOpenSidebar, 
  customLogoUrl,
  dashboardData,
  onNavigate 
}) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        className="h-9 w-9"
      >
        <Menu size={20} />
      </Button>
      
      <div className="flex-1 flex justify-center">
        <Logo customLogoUrl={customLogoUrl} collapsed />
      </div>
      
      <NotificationCenter 
        dashboardData={dashboardData}
        onNavigate={onNavigate}
      />
    </header>
  );
};

export default MobileHeader;
