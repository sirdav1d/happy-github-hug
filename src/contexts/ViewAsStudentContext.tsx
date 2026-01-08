import { createContext, useContext, useState, ReactNode } from 'react';

interface ViewAsStudent {
  id: string;
  email: string;
  companyName?: string;
}

interface ViewAsStudentContextType {
  viewAsStudent: ViewAsStudent | null;
  setViewAsStudent: (student: ViewAsStudent | null) => void;
  isViewingAsStudent: boolean;
  clearViewAsStudent: () => void;
}

const ViewAsStudentContext = createContext<ViewAsStudentContextType | undefined>(undefined);

export function useViewAsStudent(): ViewAsStudentContextType {
  const context = useContext(ViewAsStudentContext);
  if (context === undefined) {
    throw new Error('useViewAsStudent must be used within a ViewAsStudentProvider');
  }
  return context;
}

interface ViewAsStudentProviderProps {
  children: ReactNode;
}

export function ViewAsStudentProvider({ children }: ViewAsStudentProviderProps) {
  const [viewAsStudent, setViewAsStudent] = useState<ViewAsStudent | null>(null);

  const clearViewAsStudent = () => {
    setViewAsStudent(null);
  };

  const value: ViewAsStudentContextType = {
    viewAsStudent,
    setViewAsStudent,
    isViewingAsStudent: viewAsStudent !== null,
    clearViewAsStudent,
  };

  return (
    <ViewAsStudentContext.Provider value={value}>
      {children}
    </ViewAsStudentContext.Provider>
  );
}
