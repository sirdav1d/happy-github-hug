import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { ViewAsStudentProvider, useViewAsStudent } from "@/contexts/ViewAsStudentContext";
import LoginView from "@/components/central/LoginView";
import DashboardView from "@/components/central/DashboardView";
import TeamView from "@/components/central/TeamView";
import PGVView from "@/components/central/PGVView";
import SeasonalityView from "@/components/central/SeasonalityView";
import InsightsView from "@/components/central/InsightsView";
import SettingsView from "@/components/central/SettingsView";
import SalesEntryView from "@/components/central/SalesEntryView";
import RMRView from "@/components/central/rmr/RMRView";
import PGVSemanalView from "@/components/central/pgv/PGVSemanalView";
import FIVIView from "@/components/central/fivi/FIVIView";
import PipelineView from "@/components/central/pipeline/PipelineView";
import { useLeads } from "@/hooks/useLeads";
import ExecutiveSummaryView from "@/components/central/ExecutiveSummaryView";
import GlossaryView from "@/components/central/GlossaryView";
import StudentsView from "@/components/central/students/StudentsView";
import AgencyGlobalView from "@/components/central/agency/AgencyGlobalView";
import OnboardingWizard from "@/components/central/onboarding/OnboardingWizard";
import ViewingAsBanner from "@/components/central/ViewingAsBanner";
import Sidebar from "@/components/central/Sidebar";
import MobileHeader from "@/components/central/MobileHeader";
import ChatAssistant from "@/components/central/ChatAssistant";
import UploadModal from "@/components/central/UploadModal";
import useUploadSheet from "@/hooks/useUploadSheet";
import useDashboardData from "@/hooks/useDashboardData";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardData, ViewState, UploadConfig } from "@/types";

// Criar queryClient fora do componente mas com uma função
const createQueryClient = () => new QueryClient();
const queryClient = createQueryClient();

// Dados de demonstração (usado quando não há dados no banco)
const demoData: DashboardData = {
  companyName: "Empresa Demo",
  businessSegment: "Varejo",
  kpis: {
    annualGoal: 2400000,
    annualRealized: 1850000,
    lastYearGrowth: 23.5,
    mentorshipGrowth: 15,
    currentMonthName: "Dezembro",
    averageTicket: 1250,
    conversionRate: 32.5,
    cac: 180,
    ltv: 4500,
    activeCustomers: 342,
    totalSalesCount: 1480,
  },
  historicalData: [
    { month: "Jan", year: 2024, revenue: 180000, goal: 200000 },
    { month: "Fev", year: 2024, revenue: 165000, goal: 200000 },
    { month: "Mar", year: 2024, revenue: 210000, goal: 200000 },
    { month: "Abr", year: 2024, revenue: 195000, goal: 200000 },
    { month: "Mai", year: 2024, revenue: 225000, goal: 200000 },
    { month: "Jun", year: 2024, revenue: 188000, goal: 200000 },
    { month: "Jul", year: 2024, revenue: 172000, goal: 200000 },
    { month: "Ago", year: 2024, revenue: 198000, goal: 200000 },
    { month: "Set", year: 2024, revenue: 215000, goal: 200000 },
    { month: "Out", year: 2024, revenue: 232000, goal: 200000 },
    { month: "Nov", year: 2024, revenue: 245000, goal: 200000 },
    { month: "Dez", year: 2024, revenue: 285000, goal: 200000 },
  ],
  currentYearData: [
    { month: "Jan", year: 2025, revenue: 220000, goal: 200000 },
    { month: "Fev", year: 2025, revenue: 195000, goal: 200000 },
    { month: "Mar", year: 2025, revenue: 240000, goal: 200000 },
    { month: "Abr", year: 2025, revenue: 185000, goal: 200000 },
    { month: "Mai", year: 2025, revenue: 260000, goal: 200000 },
    { month: "Jun", year: 2025, revenue: 230000, goal: 200000 },
    { month: "Jul", year: 2025, revenue: 0, goal: 200000 },
    { month: "Ago", year: 2025, revenue: 0, goal: 200000 },
    { month: "Set", year: 2025, revenue: 0, goal: 200000 },
    { month: "Out", year: 2025, revenue: 0, goal: 200000 },
    { month: "Nov", year: 2025, revenue: 0, goal: 200000 },
    { month: "Dez", year: 2025, revenue: 0, goal: 200000 },
  ],
  team: [
    {
      id: "1",
      name: "Carlos Silva",
      avatar: "",
      totalRevenue: 145000,
      monthlyGoal: 120000,
      active: true,
      totalSalesCount: 48,
      weeks: [
        { week: 1, revenue: 32000, goal: 30000 },
        { week: 2, revenue: 38000, goal: 30000 },
        { week: 3, revenue: 41000, goal: 30000 },
        { week: 4, revenue: 34000, goal: 30000 },
      ],
    },
    {
      id: "2",
      name: "Ana Costa",
      avatar: "",
      totalRevenue: 128000,
      monthlyGoal: 120000,
      active: true,
      totalSalesCount: 42,
      weeks: [
        { week: 1, revenue: 28000, goal: 30000 },
        { week: 2, revenue: 35000, goal: 30000 },
        { week: 3, revenue: 32000, goal: 30000 },
        { week: 4, revenue: 33000, goal: 30000 },
      ],
    },
    {
      id: "3",
      name: "Pedro Santos",
      avatar: "",
      totalRevenue: 95000,
      monthlyGoal: 120000,
      active: true,
      totalSalesCount: 31,
      weeks: [
        { week: 1, revenue: 22000, goal: 30000 },
        { week: 2, revenue: 25000, goal: 30000 },
        { week: 3, revenue: 28000, goal: 30000 },
        { week: 4, revenue: 20000, goal: 30000 },
      ],
    },
  ],
};

const AuthenticatedApp = () => {
  const { userProfile, user, refreshProfile } = useAuth();
  const { viewAsStudent, clearViewAsStudent } = useViewAsStudent();
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isMobile = useIsMobile();
  const { processFile, isProcessing, processedData, reset } = useUploadSheet();
  
  // Se visualizando aluno, usar ID do aluno; caso contrário, usar ID do usuário atual
  const effectiveUserId = viewAsStudent?.id || user?.id;
  const { dashboardData, isLoading: isLoadingData, saveData, mergeData, fetchData } = useDashboardData(effectiveUserId);
  const { leads, isLoading: leadsLoading } = useLeads();

  // Mostrar onboarding se não completou
  useEffect(() => {
    if (userProfile && !userProfile.onboarding_completed && userProfile.role === 'business_owner') {
      setShowOnboarding(true);
    }
  }, [userProfile]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await refreshProfile();
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleUploadSuccess = async (data: any, config: UploadConfig) => {
    if (!user) return;

    const dataToSave: Partial<DashboardData> = {
      kpis: data.kpis,
      historicalData: data.historicalData,
      currentYearData: data.currentYearData,
      team: data.team,
      yearsAvailable: data.yearsAvailable,
      selectedMonth: data.selectedMonth,
      mentorshipStartDate: data.mentorshipStartDate,
    };

    if (config.replaceAllData) {
      await saveData(dataToSave, true);
    } else {
      await mergeData(dataToSave);
    }

    reset();
    setShowUploadModal(false);
    await fetchData();
  };

  const handleFileProcess = async (file: File, config: UploadConfig) => {
    return processFile(file, config);
  };

  // Usar dados do banco ou demoData se não houver dados
  const displayData = dashboardData || demoData;

  const renderCurrentView = () => {
    if (isLoadingData) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-primary animate-pulse font-mono tracking-widest text-lg">
            Carregando dados...
          </div>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardView data={displayData} />;
      case "pipeline":
        return <PipelineView team={displayData.team} />;
      case "team":
        return <TeamView team={displayData.team} monthlyGoal={200000} />;
      case "pgv":
        // Extrair mês/ano do último upload (ex: "Dez-25" → 12, 2025)
        const parseMonthYear = (selectedMonth?: string) => {
          if (!selectedMonth) return { month: new Date().getMonth() + 1, year: new Date().getFullYear() };
          const [monthStr, yearStr] = selectedMonth.split("-");
          const monthMap: Record<string, number> = {
            "Jan": 1, "Fev": 2, "Mar": 3, "Abr": 4, "Mai": 5, "Jun": 6,
            "Jul": 7, "Ago": 8, "Set": 9, "Out": 10, "Nov": 11, "Dez": 12
          };
          const month = monthMap[monthStr] || new Date().getMonth() + 1;
          const year = yearStr ? 2000 + parseInt(yearStr) : new Date().getFullYear();
          return { month, year };
        };
        
        const pgvMonthYear = parseMonthYear(displayData.selectedMonth);
        const pgvMonthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const pgvMonthData = displayData.currentYearData.find(
          d => d.month === pgvMonthNames[pgvMonthYear.month - 1]
        );
        
        return (
          <PGVSemanalView 
            team={displayData.team} 
            monthlyGoal={pgvMonthData?.goal || 200000}
            referenceMonth={pgvMonthYear.month}
            referenceYear={pgvMonthYear.year}
          />
        );
      case "rmr":
        // Buscar dados do mês anterior corretamente
        const currentMonth = new Date().getMonth(); // 0-indexed (Janeiro = 0)
        const currentYear = new Date().getFullYear();
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        let previousMonthData;
        if (currentMonth === 0) {
          // Janeiro: buscar Dezembro do último ano disponível
          // Primeiro tenta em currentYearData (que representa o último ano com dados)
          previousMonthData = displayData.currentYearData.find(d => d.month === "Dez" && d.revenue > 0);
          
          // Se não encontrou ou revenue=0, buscar o Dezembro mais recente no histórico
          if (!previousMonthData || previousMonthData.revenue === 0) {
            const dezembroHistorico = displayData.historicalData
              .filter(d => d.month === "Dez")
              .sort((a, b) => (b.year || 0) - (a.year || 0));
            previousMonthData = dezembroHistorico[0];
          }
        } else {
          // Outros meses: buscar o mês anterior no currentYearData
          const prevMonthName = monthNames[currentMonth - 1];
          previousMonthData = displayData.currentYearData.find(d => d.month === prevMonthName);
        }
        
        return (
          <RMRView 
            team={displayData.team} 
            previousMonthRevenue={previousMonthData?.revenue || 0}
            previousMonthGoal={previousMonthData?.goal || 200000}
          />
        );
      case "fivi":
        return <FIVIView team={displayData.team} />;
      case "seasonality":
        return (
          <SeasonalityView
            historicalData={displayData.historicalData}
            currentYearData={displayData.currentYearData}
            selectedMonth={displayData.selectedMonth}
            annualGoal={displayData.kpis?.annualGoal || 0}
          />
        );
      case "insights":
        return (
          <InsightsView 
            data={displayData} 
            leads={leads}
            leadsLoading={leadsLoading}
            onNavigate={setCurrentView}
          />
        );
      case "settings":
        return (
          <SettingsView 
            data={displayData} 
            onSaveSettings={async (settingsData) => {
              return saveData({
                appSettings: settingsData.appSettings,
                companyName: settingsData.companyName,
                businessSegment: settingsData.segment,
              });
            }}
          />
        );
      case "ai-summary":
        return <ExecutiveSummaryView data={displayData} />;
      case "glossary":
        return <GlossaryView />;
      case "admin-users":
        return <StudentsView />;
      case "input-center":
        return <SalesEntryView team={displayData.team} />;
      case "agency-global":
        return <AgencyGlobalView onNavigate={(view) => setCurrentView(view as ViewState)} />;
      default:
        return <DashboardView data={displayData} />;
    }
  };

  // Fechar sidebar ao mudar de view em mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [currentView, isMobile]);

  // Se onboarding não foi completado, mostrar wizard
  if (showOnboarding && userProfile?.role === 'business_owner') {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Banner de visualização como aluno */}
      <ViewingAsBanner />
      
      <div className="flex flex-1">
        {/* Mobile Header */}
        <MobileHeader 
          onOpenSidebar={() => setSidebarOpen(true)}
          dashboardData={displayData}
          onNavigate={setCurrentView}
        />
        
        <Sidebar
          currentView={currentView}
          onChangeView={setCurrentView}
          onOpenUpload={() => setShowUploadModal(true)}
          userRole={userProfile?.role || "business_owner"}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          dashboardData={displayData}
        />
        
        <main className="flex-1 md:ml-64 pt-14 md:pt-0 p-4 md:p-6 overflow-auto">
          {renderCurrentView()}
        </main>
        
        <ChatAssistant data={displayData} />
        
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            reset();
          }}
          onUploadSuccess={handleUploadSuccess}
          onFileProcess={handleFileProcess}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-mono tracking-widest text-lg">
          INICIANDO SISTEMA...
        </div>
      </div>
    );
  }

  return user ? (
    <ViewAsStudentProvider>
      <ClientProvider>
        <AuthenticatedApp />
      </ClientProvider>
    </ViewAsStudentProvider>
  ) : (
    <LoginView />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
