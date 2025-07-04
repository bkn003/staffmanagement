import React from 'react';
import { Staff, Attendance } from '../types';
import { Users, Clock, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { calculateLocationAttendance } from '../utils/salaryCalculations';

interface DashboardProps {
  staff: Staff[];
  attendance: Attendance[];
  selectedDate: string;
}

const Dashboard: React.FC<DashboardProps> = ({ staff, attendance, selectedDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(record => record.date === today);
  
  const activeStaff = staff.filter(member => member.isActive);
  const fullTimeStaff = activeStaff.filter(member => member.type === 'full-time');
  const partTimeStaff = activeStaff.filter(member => member.type === 'part-time');
  
  // Full-time attendance
  const fullTimeAttendance = todayAttendance.filter(record => !record.isPartTime);
  const presentToday = fullTimeAttendance.filter(record => record.status === 'Present').length;
  const halfDayToday = fullTimeAttendance.filter(record => record.status === 'Half Day').length;
  const absentToday = fullTimeAttendance.filter(record => record.status === 'Absent').length;

  // Part-time attendance
  const partTimeAttendance = todayAttendance.filter(record => record.isPartTime && record.status === 'Present');
  const partTimeCount = partTimeAttendance.length;

  // Calculate total present value including half days
  const totalPresentValue = presentToday + (halfDayToday * 0.5);

  const locations = [
    { 
      name: 'Big Shop', 
      color: 'bg-blue-100 text-blue-800', 
      stats: calculateLocationAttendance(activeStaff, todayAttendance, today, 'Big Shop') 
    },
    { 
      name: 'Small Shop', 
      color: 'bg-green-100 text-green-800', 
      stats: calculateLocationAttendance(activeStaff, todayAttendance, today, 'Small Shop') 
    },
    { 
      name: 'Godown', 
      color: 'bg-purple-100 text-purple-800', 
      stats: calculateLocationAttendance(activeStaff, todayAttendance, today, 'Godown') 
    }
  ];

  // Helper function to format staff names with shift info
  const formatStaffName = (staffId: string, isPartTime: boolean = false, staffName?: string, shift?: string) => {
    if (isPartTime) {
      return shift ? `${staffName} (${shift})` : staffName;
    }
    
    const staffMember = activeStaff.find(s => s.id === staffId);
    const attendanceRecord = todayAttendance.find(a => a.staffId === staffId && !a.isPartTime);
    
    if (attendanceRecord?.status === 'Half Day' && attendanceRecord?.shift) {
      return `${staffMember?.name} (${attendanceRecord.shift})`;
    }
    
    return staffMember?.name;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={32} />
            Dashboard
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-lg font-semibold text-gray-800">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Staff</p>
              <p className="text-3xl font-bold text-gray-800">{activeStaff.length}</p>
              <p className="text-xs text-gray-500">{fullTimeStaff.length} FT, {partTimeStaff.length} PT</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Present Today</p>
              <p className="text-3xl font-bold text-green-600">{totalPresentValue}</p>
              <p className="text-xs text-gray-500">{presentToday} Full, {halfDayToday} Half</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Half Day Today</p>
              <p className="text-3xl font-bold text-yellow-600">{halfDayToday}</p>
              <p className="text-xs text-gray-500">Partial attendance</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Absent Today</p>
              <p className="text-3xl font-bold text-red-600">{absentToday}</p>
              <p className="text-xs text-gray-500">Not present</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Part-Time Today</p>
              <p className="text-3xl font-bold text-purple-600">{partTimeCount}</p>
              <p className="text-xs text-gray-500">Working today</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Location-based Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          Today's Attendance by Location (Including Part-Time & Shifts)
        </h2>
        
        <div className="space-y-6">
          {locations.map((location) => {
            // Get part-time staff for this location
            const locationPartTime = partTimeAttendance.filter(record => 
              record.location === location.name
            );

            // Get full-time staff with detailed names (including shift info for half-day)
            const locationFullTimePresent = fullTimeAttendance.filter(record => {
              const staffMember = activeStaff.find(s => s.id === record.staffId);
              const attendanceLocation = record.location || staffMember?.location;
              return record.status === 'Present' && attendanceLocation === location.name;
            }).map(record => formatStaffName(record.staffId, false));

            const locationFullTimeHalfDay = fullTimeAttendance.filter(record => {
              const staffMember = activeStaff.find(s => s.id === record.staffId);
              const attendanceLocation = record.location || staffMember?.location;
              return record.status === 'Half Day' && attendanceLocation === location.name;
            }).map(record => formatStaffName(record.staffId, false));

            const locationFullTimeAbsent = fullTimeAttendance.filter(record => {
              const staffMember = activeStaff.find(s => s.id === record.staffId);
              const attendanceLocation = record.location || staffMember?.location;
              return record.status === 'Absent' && attendanceLocation === location.name;
            }).map(record => formatStaffName(record.staffId, false));

            // Calculate total present value for this location
            const locationTotalPresent = locationFullTimePresent.length + (locationFullTimeHalfDay.length * 0.5);

            return (
              <div key={location.name} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-semibold text-blue-600 mb-4 text-center">
                  {location.name} - Total Present Value: {locationTotalPresent}
                  {locationPartTime.length > 0 && ` + ${locationPartTime.length} Part-Time`}
                </h3>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-green-600 mb-1">Present: {locationFullTimePresent.length}</p>
                    <p className="text-sm text-gray-600">
                      {locationFullTimePresent.length > 0 ? locationFullTimePresent.join(', ') : 'None'}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-yellow-600 mb-1">Half-day: {locationFullTimeHalfDay.length}</p>
                    <p className="text-sm text-gray-600">
                      {locationFullTimeHalfDay.length > 0 ? locationFullTimeHalfDay.join(', ') : 'None'}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-red-600 mb-1">Absent: {locationFullTimeAbsent.length}</p>
                    <p className="text-sm text-gray-600">
                      {locationFullTimeAbsent.length > 0 ? locationFullTimeAbsent.join(', ') : 'None'}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-purple-600 mb-1">Part-Time: {locationPartTime.length}</p>
                    <p className="text-sm text-gray-600">
                      {locationPartTime.length > 0 
                        ? locationPartTime.map(pt => formatStaffName(pt.staffId, true, pt.staffName, pt.shift)).join(', ')
                        : 'None'
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;