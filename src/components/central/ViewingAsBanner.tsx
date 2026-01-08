import { X, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewAsStudent } from '@/contexts/ViewAsStudentContext';

export default function ViewingAsBanner() {
  const { viewAsStudent, clearViewAsStudent, isViewingAsStudent } = useViewAsStudent();

  if (!isViewingAsStudent || !viewAsStudent) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary/90 to-violet-600/90 backdrop-blur-sm border-b border-primary/20 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-white/80" />
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm">Visualizando como:</span>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
              {viewAsStudent.companyName && (
                <>
                  <Building2 className="w-4 h-4 text-white/70" />
                  <span className="text-white font-medium">{viewAsStudent.companyName}</span>
                  <span className="text-white/50">•</span>
                </>
              )}
              <span className="text-white/90 text-sm">{viewAsStudent.email}</span>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearViewAsStudent}
          className="text-white hover:bg-white/10 hover:text-white gap-2"
        >
          <X className="w-4 h-4" />
          Voltar para minha conta
        </Button>
      </div>
    </div>
  );
}
