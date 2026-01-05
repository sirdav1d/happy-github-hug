import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
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
import Sidebar from "@/components/central/Sidebar";
import ChatAssistant from "@/components/central/ChatAssistant";
import UploadModal from "@/components/central/UploadModal";
import useUploadSheet from "@/hooks/useUploadSheet";
import useDashboardData from "@/hooks/useDashboardData";
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
  const { userProfile, user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { processFile, isProcessing, processedData, reset } = useUploadSheet();
  const { dashboardData, isLoading: isLoadingData, saveData, mergeData, fetchData } = useDashboardData(user?.id);

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
      case "team":
        return <TeamView team={displayData.team} monthlyGoal={200000} />;
      case "pgv":
        return <PGVSemanalView team={displayData.team} monthlyGoal={displayData.kpis?.annualGoal ? displayData.kpis.annualGoal / 12 : 200000} />;
      case "rmr":
        // Buscar dados do mês anterior do ano atual
        const currentMonth = new Date().getMonth(); // 0-indexed (Janeiro = 0)
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        let previousMonthData;
        if (currentMonth === 0) {
          // Se estamos em Janeiro, pegar Dezembro do ano anterior
          previousMonthData = displayData.historicalData.find(d => d.month === "Dez");
        } else {
          // Pegar o mês anterior no ano atual
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
        return <InsightsView data={displayData} />;
      case "settings":
        return <SettingsView data={displayData} />;
      case "ai-summary":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Sumário Executivo</h2>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case "glossary":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Glossário</h2>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case "admin-users":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Gestão de Alunos</h2>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case "input-center":
        return <SalesEntryView team={displayData.team} />;
      case "agency-global":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Visão Global Agência</h2>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      default:
        return <DashboardView data={displayData} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenUpload={() => setShowUploadModal(true)}
        userRole={userProfile?.role || "business_owner"}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
      
      <main className="flex-1 ml-64 p-6 overflow-auto">
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
    <ClientProvider>
      <AuthenticatedApp />
    </ClientProvider>
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
