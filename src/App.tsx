import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StaffManagement from './components/StaffManagement';
import AttendanceTracker from './components/AttendanceTracker';
import SalaryManagement from './components/SalaryManagement';
import PartTimeStaff from './components/PartTimeStaff';
import OldStaffRecords from './components/OldStaffRecords';
import SalaryHikeModal from './components/SalaryHikeModal';
import { NavigationTab, Staff, Attendance, AdvanceDeduction, OldStaffRecord, SalaryHike, User } from './types';
import { staffService } from './services/staffService';
import { attendanceService } from './services/attendanceService';
import { advanceService } from './services/advanceService';
import { oldStaffService } from './services/oldStaffService';
import { salaryHikeService } from './services/salaryHikeService';
import { isSunday } from './utils/salaryCalculations';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('Dashboard');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<AdvanceDeduction[]>([]);
  const [oldStaffRecords, setOldStaffRecords] = useState<OldStaffRecord[]>([]);
  const [salaryHikes, setSalaryHikes] = useState<SalaryHike[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [salaryHikeModal, setSalaryHikeModal] = useState<{
    isOpen: boolean;
    staffId: string;
    staffName: string;
    currentSalary: number;
    newSalary: number;
    onConfirm: (isHike: boolean, reason?: string) => void;
  } | null>(null);

  // Load all data from Supabase on app start
  useEffect(() => {
    // Check for existing login session
    const savedLogin = localStorage.getItem('staffManagementLogin');
    if (savedLogin) {
      try {
        const loginData = JSON.parse(savedLogin);
        const now = Date.now();
        
        // Check if session is still valid (30 days)
        if (now - loginData.timestamp < loginData.expiresIn) {
          setUser(loginData.user);
        } else {
          // Session expired, remove it
          localStorage.removeItem('staffManagementLogin');
        }
      } catch (error) {
        // Invalid session data, remove it
        localStorage.removeItem('staffManagementLogin');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Set default tab based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        setActiveTab('Attendance');
      } else {
        setActiveTab('Dashboard');
      }
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [staffData, attendanceData, advancesData, oldStaffData, salaryHikesData] = await Promise.all([
        staffService.getAll(),
        attendanceService.getAll(),
        advanceService.getAll(),
        oldStaffService.getAll(),
        salaryHikeService.getAll()
      ]);

      setStaff(staffData);
      setAttendance(attendanceData);
      setAdvances(advancesData);
      setOldStaffRecords(oldStaffData);
      setSalaryHikes(salaryHikesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('staffManagementLogin');
    setUser(null);
    setActiveTab('Dashboard');
  };

  // Filter staff based on user role and location
  const getFilteredStaff = () => {
    if (user?.role === 'admin') {
      return staff;
    } else if (user?.role === 'manager' && user.location) {
      return staff.filter(member => member.location === user.location);
    }
    return [];
  };

  // Filter attendance based on user role and location
  const getFilteredAttendance = () => {
    if (user?.role === 'admin') {
      return attendance;
    } else if (user?.role === 'manager' && user.location) {
      const locationStaffIds = staff
        .filter(member => member.location === user.location)
        .map(member => member.id);
      
      return attendance.filter(record => 
        record.isPartTime 
          ? record.location === user.location
          : locationStaffIds.includes(record.staffId)
      );
    }
    return [];
  };

  // Auto-carry forward advances from previous month
  useEffect(() => {
    if (staff.length === 0 || advances.length === 0 || user?.role !== 'admin') return;

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
          }
        }
      }
    }
    )
    // Check if manager is trying to edit non-today attendance
    if (user?.role === 'manager') {
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) {
        alert('Managers can only edit today\'s attendance');
        return;
      }
    }

    // Handle part-time staff deletion
    if (isPartTime && status === 'Absent' && salary === 0) {
      try {
        // Find and delete the attendance record
        const recordToDelete = attendance.find(a => 
          a.staffId === staffId && 
          a.date === date && 
          a.isPartTime === true &&
          a.staffName === staffName
        );
        
        if (recordToDelete) {
          // Remove from local state
          setAttendance(prev => prev.filter(a => a.id !== recordToDelete.id));
          
          // Delete from database using Supabase
          const { error } = await attendanceService.delete(recordToDelete.id);
          if (error) {
            console.error('Error deleting attendance record:', error);
            // Restore the record if deletion failed
            setAttendance(prev => [...prev, recordToDelete]);
          }
        }
        return;
      } catch (error) {
        console.error('Error deleting part-time attendance:', error);
        return;
      }
    }

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
      location,
      salary,
      salaryOverride,
      arrivalTime,
      leavingTime
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
  )

  // Delete part-time attendance record
  const deletePartTimeAttendance = async (attendanceId: string) => {
    try {
      // Remove from local state first
      const recordToDelete = attendance.find(a => a.id === attendanceId);
      setAttendance(prev => prev.filter(a => a.id !== attendanceId));
      
      // Delete from database
      await attendanceService.delete(attendanceId);
    } catch (error) {
      console.error('Error deleting part-time attendance:', error);
      // Restore the record if deletion failed
      if (recordToDelete) {
        setAttendance(prev => [...prev, recordToDelete]);
      }
    }
  };

  // Bulk update attendance (admin only)
  const bulkUpdateAttendance = async (date: string, status: 'Present' | 'Absent') => {
    // Allow both admin and managers to perform bulk updates
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      alert('Only administrators and managers can perform bulk updates');
      return;
    }

    // Filter staff based on user role and location
    let targetStaff = staff.filter(member => member.isActive);
    
    if (user.role === 'manager' && user.location) {
      // Managers can only bulk update staff from their location
      targetStaff = targetStaff.filter(member => member.location === user.location);
    }

    const attendanceRecords = targetStaff.map(member => ({
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

  // Add new staff member (admin only)
  const addStaff = async (newStaff: Omit<Staff, 'id'>) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can add staff');
      return;
    }

    try {
      // Set initial salary for hike tracking
      const staffWithInitialSalary = {
        ...newStaff,
        initialSalary: newStaff.totalSalary
      };
      
      const savedStaff = await staffService.create(staffWithInitialSalary);
      setStaff(prev => [...prev, savedStaff]);
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  // Update staff member with salary hike tracking
  const updateStaff = async (id: string, updatedStaff: Partial<Staff>) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can update staff');
      return;
    }

    const currentStaff = staff.find(s => s.id === id);
    if (!currentStaff) return;

    // Check if salary is being changed
    const isSalaryChange = updatedStaff.totalSalary && updatedStaff.totalSalary !== currentStaff.totalSalary;
    
    if (isSalaryChange) {
      // Show salary hike modal
      setSalaryHikeModal({
        isOpen: true,
        staffId: id,
        staffName: currentStaff.name,
        currentSalary: currentStaff.totalSalary,
        newSalary: updatedStaff.totalSalary!,
        onConfirm: async (isHike: boolean, reason?: string) => {
          try {
            // Update staff record
            const savedStaff = await staffService.update(id, updatedStaff);
            setStaff(prev => prev.map(member => 
              member.id === id ? savedStaff : member
            ));

            // If it's a hike, record it
            if (isHike) {
              const salaryHike = {
                staffId: id,
                oldSalary: currentStaff.totalSalary,
                newSalary: updatedStaff.totalSalary!,
                hikeDate: new Date().toISOString(),
                reason
              };
              
              const savedHike = await salaryHikeService.create(salaryHike);
              setSalaryHikes(prev => [savedHike, ...prev]);
            }
          } catch (error) {
            console.error('Error updating staff:', error);
          }
        }
      });
    } else {
      // Regular update without salary change
      try {
        const savedStaff = await staffService.update(id, updatedStaff);
        setStaff(prev => prev.map(member => 
          member.id === id ? savedStaff : member
        ));
      } catch (error) {
        console.error('Error updating staff:', error);
      }
    }
  };

  // Delete staff member (admin only)
  const deleteStaff = async (id: string, reason: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can delete staff');
      return;
    }

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
      
      // Soft delete - mark as inactive instead of hard delete
      await staffService.update(id, { isActive: false });

      // Update local state
      setOldStaffRecords(prev => [...prev, savedOldRecord]);
      setStaff(prev => prev.map(member => 
        member.id === id ? { ...member, isActive: false } : member
      ));
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  // Rejoin staff from old records (admin only)
  const rejoinStaff = async (record: OldStaffRecord) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can rejoin staff');
      return;
    }

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
        isActive: true,
        initialSalary: record.totalSalary
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

  // Update advances and deductions (admin only)
  const updateAdvances = async (staffId: string, month: number, year: number, advanceData: Partial<AdvanceDeduction>) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can update advances');
      return;
    }

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

    const filteredStaff = getFilteredStaff();
    const filteredAttendance = getFilteredAttendance();

    switch (activeTab) {
      case 'Dashboard':
        if (user?.role !== 'admin') return null;
        return (
          <Dashboard 
            staff={filteredStaff} 
            attendance={filteredAttendance} 
            selectedDate={selectedDate}
          />
        );
      case 'Staff Management':
        if (user?.role !== 'admin') return null;
        return (
          <StaffManagement 
            staff={filteredStaff}
            salaryHikes={salaryHikes}
            onAddStaff={addStaff}
            onUpdateStaff={updateStaff}
            onDeleteStaff={deleteStaff}
          />
        );
      case 'Attendance':
        return (
          <AttendanceTracker 
            staff={filteredStaff}
            attendance={filteredAttendance}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onUpdateAttendance={updateAttendance}
            onBulkUpdateAttendance={bulkUpdateAttendance}
            userRole={user?.role || 'manager'}
          />
        );
      case 'Salary Management':
        if (user?.role !== 'admin') return null;
        return (
          <SalaryManagement 
            staff={filteredStaff}
            attendance={filteredAttendance}
            advances={advances}
            onUpdateAdvances={updateAdvances}
          />
        );
      case 'Part-Time Staff':
        return (
          <PartTimeStaff 
            attendance={filteredAttendance}
            staff={staff}
            onUpdateAttendance={updateAttendance}
            onDeletePartTimeAttendance={deletePartTimeAttendance}
            userLocation={user?.location}
          />
        );
      case 'Old Staff Records':
        if (user?.role !== 'admin') return null;
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto">
        {renderContent()}
      </main>
      
      {salaryHikeModal && (
        <SalaryHikeModal
          isOpen={salaryHikeModal.isOpen}
          onClose={() => setSalaryHikeModal(null)}
          staffName={salaryHikeModal.staffName}
          currentSalary={salaryHikeModal.currentSalary}
          staff={filteredStaff}
          newSalary={salaryHikeModal.newSalary}
          onConfirm={salaryHikeModal.onConfirm}
        />
      )}
    </div>
  );
}

export default App;