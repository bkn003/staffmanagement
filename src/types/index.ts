export interface Staff {
  id: string;
  name: string;
  location: 'Big Shop' | 'Small Shop' | 'Godown';
  type: 'full-time' | 'part-time';
  experience: string;
  basicSalary: number;
  incentive: number;
  hra: number;
  totalSalary: number;
  joinedDate: string;
  isActive: boolean;
}

export interface PartTimeStaff {
  id: string;
  name: string;
  location: 'Big Shop' | 'Small Shop' | 'Godown';
  shift: 'Morning' | 'Evening' | 'Both';
  ratePerDay: number;
  ratePerShift: number;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  status: 'Present' | 'Half Day' | 'Absent';
  attendanceValue: number; // 1 for Present, 0.5 for Half Day, 0 for Absent
  isSunday?: boolean;
  shift?: 'Morning' | 'Evening' | 'Both'; // For part-time staff
  isPartTime?: boolean;
  staffName?: string; // For part-time staff (not stored permanently)
  location?: string;
  salary?: number; // For part-time staff daily salary
  salaryOverride?: boolean; // If salary was manually edited
}

export interface SalaryDetail {
  staffId: string;
  month: number;
  year: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  sundayAbsents: number;
  oldAdv: number;
  curAdv: number;
  deduction: number;
  basicEarned: number;
  incentiveEarned: number;
  hraEarned: number;
  sundayPenalty: number;
  grossSalary: number;
  newAdv: number;
  netSalary: number;
  isProcessed: boolean;
}

export interface PartTimeSalaryDetail {
  staffName: string;
  location: string;
  totalDays: number;
  totalShifts: number;
  ratePerDay: number;
  ratePerShift: number;
  totalEarnings: number;
  month: number;
  year: number;
  weeklyBreakdown: WeeklySalary[];
}

export interface WeeklySalary {
  week: number;
  days: DailySalary[];
  weekTotal: number;
}

export interface DailySalary {
  date: string;
  dayOfWeek: string;
  isPresent: boolean;
  isSunday: boolean;
  salary: number;
  isOverride: boolean;
}

export interface OldStaffRecord {
  id: string;
  originalStaffId: string;
  name: string;
  location: 'Big Shop' | 'Small Shop' | 'Godown';
  type: 'full-time' | 'part-time';
  experience: string;
  basicSalary: number;
  incentive: number;
  hra: number;
  totalSalary: number;
  joinedDate: string;
  leftDate: string;
  reason: string;
  salaryHistory: SalaryDetail[];
  totalAdvanceOutstanding: number;
  lastAdvanceData?: AdvanceDeduction; // Store last month's advance data for rejoin
}

export interface AdvanceDeduction {
  id: string;
  staffId: string;
  month: number;
  year: number;
  oldAdvance: number;
  currentAdvance: number;
  deduction: number;
  newAdvance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NavigationTab = 'Dashboard' | 'Staff Management' | 'Attendance' | 'Salary Management' | 'Part-Time Staff' | 'Old Staff Records';

export interface AttendanceFilter {
  date?: string;
  shift?: 'Morning' | 'Evening' | 'Both' | 'All';
  staffType?: 'full-time' | 'part-time' | 'all';
}