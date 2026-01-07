import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  customLogoUrl?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar, customLogoUrl }) => {
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
      
      {/* Spacer para centralizar o logo */}
      <div className="w-9" />
    </header>
  );
};

export default MobileHeader;
