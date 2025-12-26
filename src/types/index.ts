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
  | 'seasonality'
  | 'team'
  | 'pgv'
  | 'insights'
  | 'ai-summary'
  | 'glossary'
  | 'settings'
  | 'admin-users'
  | 'input-center'
  | 'agency-global';

export type UserRole = 'consultant' | 'business_owner';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  companyName?: string;
  segment?: string;
  createdAt: string;
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
