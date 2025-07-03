import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StaffManagement from './components/StaffManagement';
import AttendanceTracker from './components/AttendanceTracker';
import SalaryManagement from './components/SalaryManagement';
import PartTimeStaff from './components/PartTimeStaff';
import OldStaffRecords from './components/OldStaffRecords';
import { NavigationTab, Staff, Attendance, AdvanceDeduction, OldStaffRecord } from './types';
import { staffService } from './services/staffService';
import { attendanceService } from './services/attendanceService';
import { advanceService } from './services/advanceService';
import { oldStaffService } from './services/oldStaffService';
import { isSunday } from './utils/salaryCalculations';

function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('Dashboard');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<AdvanceDeduction[]>([]);
  const [oldStaffRecords, setOldStaffRecords] = useState<OldStaffRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  // Load all data from Supabase on app start
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [staffData, attendanceData, advancesData, oldStaffData] = await Promise.all([
        staffService.getAll(),
        attendanceService.getAll(),
        advanceService.getAll(),
        oldStaffService.getAll()
      ]);

      setStaff(staffData);
      setAttendance(attendanceData);
      setAdvances(advancesData);
      setOldStaffRecords(oldStaffData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-carry forward advances from previous month
  useEffect(() => {
    if (staff.length === 0 || advances.length === 0) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    staff.filter(s => s.isActive).forEach(async (member) => {
      const existingAdvance = advances.find(adv => 
        adv.staffId === member.id && 
        adv.month === currentMonth && 
        adv.year === currentYear
      );
      
      if (!existingAdvance) {
        const previousAdvance = await advanceService.getPreviousMonthAdvance(member.id, currentMonth, currentYear);
        if (previousAdvance > 0) {
          const newAdvanceRecord = {
            staffId: member.id,
            month: currentMonth,
            year: currentYear,
            oldAdvance: previousAdvance,
            currentAdvance: 0,
            deduction: 0,
            newAdvance: previousAdvance,
            notes: 'Auto-carried from previous month'
          };
          
          try {
            const savedAdvance = await advanceService.upsert(newAdvanceRecord);
            setAdvances(prev => [...prev, savedAdvance]);
          } catch (error) {
            console.error('Error creating auto-advance:', error);
          }
        }
      }
    });
  }, [staff, advances]);

  // Update attendance for a specific staff member
  const updateAttendance = async (
    staffId: string, 
    date: string, 
    status: 'Present' | 'Half Day' | 'Absent',
    isPartTime?: boolean,
    staffName?: string,
    shift?: 'Morning' | 'Evening' | 'Both',
    location?: string
  ) => {
    const attendanceValue = status === 'Present' ? 1 : status === 'Half Day' ? 0.5 : 0;
    
    const attendanceRecord = {
      staffId,
      date,
      status,
      attendanceValue,
      isSunday: isSunday(date),
      isPartTime: !!isPartTime,
      staffName,
      shift,
      location
    };

    try {
      const savedAttendance = await attendanceService.upsert(attendanceRecord);
      
      setAttendance(prev => {
        const existingIndex = prev.findIndex(a => 
          a.staffId === staffId && 
          a.date === date && 
          a.isPartTime === !!isPartTime
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedAttendance;
          return updated;
        } else {
          return [...prev, savedAttendance];
        }
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  // Bulk update attendance
  const bulkUpdateAttendance = async (date: string, status: 'Present' | 'Absent') => {
    const activeStaff = staff.filter(member => member.isActive);
    const attendanceRecords = activeStaff.map(member => ({
      staffId: member.id,
      date,
      status,
      attendanceValue: status === 'Present' ? 1 : 0,
      isSunday: isSunday(date),
      isPartTime: false
    }));

    try {
      const savedRecords = await attendanceService.bulkUpsert(attendanceRecords);
      
      setAttendance(prev => {
        const filtered = prev.filter(a => !(a.date === date && !a.isPartTime));
        return [...filtered, ...savedRecords];
      });
    } catch (error) {
      console.error('Error bulk updating attendance:', error);
    }
  };

  // Add new staff member
  const addStaff = async (newStaff: Omit<Staff, 'id'>) => {
    try {
      const savedStaff = await staffService.create(newStaff);
      setStaff(prev => [...prev, savedStaff]);
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  // Update staff member
  const updateStaff = async (id: string, updatedStaff: Partial<Staff>) => {
    try {
      const savedStaff = await staffService.update(id, updatedStaff);
      setStaff(prev => prev.map(member => 
        member.id === id ? savedStaff : member
      ));
    } catch (error) {
      console.error('Error updating staff:', error);
    }
  };

  // Delete staff member (archive to old records)
  const deleteStaff = async (id: string, reason: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (!staffMember) return;

    try {
      // Calculate outstanding advances
      const staffAdvances = advances.filter(adv => adv.staffId === id);
      const latestAdvance = staffAdvances
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      const totalAdvanceOutstanding = latestAdvance?.newAdvance || 0;

      // Create old staff record
      const oldRecord = {
        originalStaffId: id,
        name: staffMember.name,
        location: staffMember.location,
        type: staffMember.type,
        experience: staffMember.experience,
        basicSalary: staffMember.basicSalary,
        incentive: staffMember.incentive,
        hra: staffMember.hra,
        totalSalary: staffMember.totalSalary,
        joinedDate: staffMember.joinedDate,
        leftDate: new Date().toLocaleDateString('en-US'),
        reason,
        salaryHistory: [],
        totalAdvanceOutstanding,
        lastAdvanceData: latestAdvance
      };

      // Save to database
      const savedOldRecord = await oldStaffService.create(oldRecord);
      await staffService.delete(id);

      // Update local state
      setOldStaffRecords(prev => [...prev, savedOldRecord]);
      setStaff(prev => prev.map(member => 
        member.id === id ? { ...member, isActive: false } : member
      ));
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  // Rejoin staff from old records
  const rejoinStaff = async (record: OldStaffRecord) => {
    try {
      // Restore staff member
      const restoredStaff = {
        name: record.name,
        location: record.location,
        type: record.type,
        experience: record.experience,
        basicSalary: record.basicSalary,
        incentive: record.incentive,
        hra: record.hra,
        totalSalary: record.totalSalary,
        joinedDate: new Date().toLocaleDateString('en-US'), // New join date
        isActive: true
      };

      const savedStaff = await staffService.create(restoredStaff);

      // Restore advance data if exists
      if (record.lastAdvanceData && record.totalAdvanceOutstanding > 0) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const restoredAdvance = {
          staffId: savedStaff.id,
          month: currentMonth,
          year: currentYear,
          oldAdvance: record.totalAdvanceOutstanding,
          currentAdvance: 0,
          deduction: 0,
          newAdvance: record.totalAdvanceOutstanding,
          notes: `Restored from old record - ${record.name}`
        };

        const savedAdvance = await advanceService.upsert(restoredAdvance);
        setAdvances(prev => [...prev, savedAdvance]);
      }

      // Remove from old records
      await oldStaffService.delete(record.id);

      // Update local state
      setStaff(prev => [...prev, savedStaff]);
      setOldStaffRecords(prev => prev.filter(r => r.id !== record.id));
    } catch (error) {
      console.error('Error rejoining staff:', error);
    }
  };

  // Update advances and deductions
  const updateAdvances = async (staffId: string, month: number, year: number, advanceData: Partial<AdvanceDeduction>) => {
    try {
      const existingAdvance = advances.find(adv => 
        adv.staffId === staffId && adv.month === month && adv.year === year
      );

      const advanceRecord = {
        staffId,
        month,
        year,
        oldAdvance: existingAdvance?.oldAdvance || 0,
        currentAdvance: existingAdvance?.currentAdvance || 0,
        deduction: existingAdvance?.deduction || 0,
        newAdvance: existingAdvance?.newAdvance || 0,
        notes: existingAdvance?.notes,
        ...advanceData
      };

      const savedAdvance = await advanceService.upsert(advanceRecord);
      
      setAdvances(prev => {
        const existingIndex = prev.findIndex(adv => 
          adv.staffId === staffId && adv.month === month && adv.year === year
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedAdvance;
          return updated;
        } else {
          return [...prev, savedAdvance];
        }
      });
    } catch (error) {
      console.error('Error updating advances:', error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data from database...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard 
            staff={staff} 
            attendance={attendance} 
            selectedDate={selectedDate}
          />
        );
      case 'Staff Management':
        return (
          <StaffManagement 
            staff={staff}
            onAddStaff={addStaff}
            onUpdateStaff={updateStaff}
            onDeleteStaff={deleteStaff}
          />
        );
      case 'Attendance':
        return (
          <AttendanceTracker 
            staff={staff}
            attendance={attendance}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onUpdateAttendance={updateAttendance}
            onBulkUpdateAttendance={bulkUpdateAttendance}
          />
        );
      case 'Salary Management':
        return (
          <SalaryManagement 
            staff={staff}
            attendance={attendance}
            advances={advances}
            onUpdateAdvances={updateAdvances}
          />
        );
      case 'Part-Time Staff':
        return (
          <PartTimeStaff 
            attendance={attendance}
            onUpdateAttendance={updateAttendance}
          />
        );
      case 'Old Staff Records':
        return (
          <OldStaffRecords 
            oldStaffRecords={oldStaffRecords}
            onRejoinStaff={rejoinStaff}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;