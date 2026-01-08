export interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  goal: number;
}

export interface YearlyRevenue {
  year: number;
  months: MonthlyData[];
  totalRevenue: number;
  totalGoal: number;
}

export interface SalespersonWeekly {
  week: number;
  revenue: number;
  goal: number;
  revenueOnline?: number;
  goalOnline?: number;
  revenuePresencial?: number;
  goalPresencial?: number;
  salesCount?: number;
  attendances?: number;
}

export interface Salesperson {
  id: string;
  name: string;
  avatar: string;
  totalRevenue: number;
  monthlyGoal: number;
  active: boolean;
  weeks: SalespersonWeekly[];
  isPlaceholder?: boolean;
  totalSalesCount: number;
  totalAttendances?: number;
}

export interface KPI {
  annualGoal: number;
  annualRealized: number;
  lastYearGrowth: number;
  mentorshipGrowth: number;
  currentMonthName: string;
  averageTicket: number;
  conversionRate: number;
  cac: number;
  ltv: number;
  activeCustomers: number;
  totalSalesCount: number;
  totalAttendances?: number;
}

export interface AppSettings {
  aggressiveMode: boolean;
  considerVacation: boolean;
}

export interface DashboardData {
  companyName: string;
  businessSegment: string;
  customLogoUrl?: string;
  appSettings?: AppSettings;
  kpis: KPI;
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
  team: Salesperson[];
  // Novos campos para o sistema de upload atualizado
  mentorshipStartDate?: string;
  yearsAvailable?: number[];
  selectedMonth?: string;
  lastUploadDate?: string;
  yearlyData?: YearlyRevenue[];
}

export interface UploadConfig {
  selectedMonth: number; // 1-12
  selectedYear: number;
  replaceAllData: boolean;
}

export type ViewState =
  | 'dashboard'
  | 'pipeline'
  | 'seasonality'
  | 'team'
  | 'pgv'
  | 'rmr'
  | 'fivi'
  | 'insights'
  | 'ai-summary'
  | 'glossary'
  | 'settings'
  | 'admin-users'
  | 'input-center'
  | 'agency-global';

// ============ Rituais Types ============

// RMR - Reunião de Metas e Reconhecimento
export interface RMRMeeting {
  id: string;
  date: string;
  month: number;
  year: number;
  status: 'scheduled' | 'completed' | 'pending';
  highlightedEmployee?: string;
  highlightReason?: string;
  monthlyGoal: number;
  previousMonthRevenue: number;
  notes?: string;
  motivationalTheme?: string;
  strategies?: string[];
}

// PGV Semanal - Painel de Gestão à Vista
export interface PGVWeekEntry {
  salespersonId: string;
  salespersonName: string;
  dailyGoal: number;
  weeklyGoal: number;
  weeklyRealized: number;
  monthlyAccumulated: number;
  percentAchieved: number;
}

export interface PGVWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  workingDays: number;
  entries: PGVWeekEntry[];
  totalGoal: number;
  totalRealized: number;
}

export interface PGVMonth {
  month: number;
  year: number;
  monthlyGoal: number;
  weeks: PGVWeek[];
  premiumPolicy?: PremiumPolicy;
}

export interface PremiumPolicy {
  tiers: {
    minPercent: number;
    maxPercent: number;
    reward: string;
  }[];
}

// FIVI - Feedback Individual do Vendedor
export interface FIVISession {
  id: string;
  salespersonId: string;
  salespersonName: string;
  date: string;
  weekNumber: number;
  // As 5 perguntas estratégicas
  actionsExecuted: string;
  improvementIdeas: string;
  failedActions: string;
  supportNeeded: string;
  weeklyCommitment: number;
  // Dados do PGV vinculados
  weeklyGoal: number;
  weeklyRealized: number;
  previousCommitment?: number;
  previousRealized?: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export type UserRole = 'consultant' | 'business_owner';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  companyName?: string;
  segment?: string;
  createdAt: string;
  onboarding_completed?: boolean;
  avatar_url?: string;
  plan_id?: string;
  plan_expires_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'registered';
  registeredUid?: string;
  createdAt: string;
  createdBy: string;
}
