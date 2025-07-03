import React, { useState } from 'react';
import { Staff, Attendance, AttendanceFilter } from '../types';
import { Calendar, Download, Check, X, Filter } from 'lucide-react';
import { isSunday } from '../utils/salaryCalculations';
import { exportAttendancePDF } from '../utils/pdfExport';

interface AttendanceTrackerProps {
  staff: Staff[];
  attendance: Attendance[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onUpdateAttendance: (staffId: string, date: string, status: 'Present' | 'Half Day' | 'Absent', isPartTime?: boolean, staffName?: string, shift?: 'Morning' | 'Evening' | 'Both', location?: string) => void;
  onBulkUpdateAttendance: (date: string, status: 'Present' | 'Absent') => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  staff,
  attendance,
  selectedDate,
  onDateChange,
  onUpdateAttendance,
  onBulkUpdateAttendance
}) => {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [monthlyDate, setMonthlyDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  const [filters, setFilters] = useState<AttendanceFilter>({
    shift: 'All',
    staffType: 'all'
  });

  const activeStaff = staff.filter(member => member.isActive);

  const getAttendanceForDate = (staffId: string, date: string) => {
    const record = attendance.find(a => a.staffId === staffId && a.date === date && !a.isPartTime);
    return record?.status || 'Absent';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Half Day':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'Big Shop':
        return 'bg-blue-100 text-blue-800';
      case 'Small Shop':
        return 'bg-green-100 text-green-800';
      case 'Godown':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'Morning':
        return 'bg-orange-100 text-orange-800';
      case 'Evening':
        return 'bg-indigo-100 text-indigo-800';
      case 'Both':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter attendance based on filters
  const getFilteredAttendance = () => {
    let filteredAttendance = attendance.filter(record => record.date === selectedDate);

    if (filters.staffType === 'full-time') {
      filteredAttendance = filteredAttendance.filter(record => !record.isPartTime);
    } else if (filters.staffType === 'part-time') {
      filteredAttendance = filteredAttendance.filter(record => record.isPartTime);
    }

    if (filters.shift && filters.shift !== 'All') {
      filteredAttendance = filteredAttendance.filter(record => 
        record.shift === filters.shift || !record.isPartTime
      );
    }

    return filteredAttendance;
  };

  const handleExportPDF = () => {
    exportAttendancePDF(staff, attendance, selectedDate);
  };

  const generateMonthlyView = () => {
    const year = monthlyDate.year;
    const month = monthlyDate.month;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            Monthly Attendance View
          </h2>
          <div className="flex gap-4">
            <select
              value={monthlyDate.month}
              onChange={(e) => setMonthlyDate({ ...monthlyDate, month: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={monthlyDate.year}
              onChange={(e) => setMonthlyDate({ ...monthlyDate, year: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                {days.map(day => {
                  const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isDateSunday = isSunday(date);
                  return (
                    <th key={day} className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                      isDateSunday ? 'bg-red-50 text-red-600' : 'text-gray-500'
                    }`}>
                      {day}
                      {isDateSunday && <div className="text-xs">Sun</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeStaff.map((member, index) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                  {days.map(day => {
                    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = getAttendanceForDate(member.id, date);
                    const isDateSunday = isSunday(date);
                    return (
                      <td key={day} className={`px-2 py-4 text-center ${isDateSunday ? 'bg-red-50' : ''}`}>
                        <span className={`inline-block w-6 h-6 rounded text-xs font-semibold leading-6 ${
                          status === 'Present' ? 'bg-green-500 text-white' :
                          status === 'Half Day' ? 'bg-yellow-500 text-white' :
                          status === 'Absent' ? (isDateSunday ? 'bg-red-700 text-white' : 'bg-red-500 text-white') : 'bg-gray-200 text-gray-500'
                        }`}>
                          {status === 'Present' ? 'P' : status === 'Half Day' ? 'H' : status === 'Absent' ? 'A' : '-'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded"></span>
            <span>Present (P)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-500 rounded"></span>
            <span>Half Day (H)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded"></span>
            <span>Absent (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-700 rounded"></span>
            <span>Sunday Absent (₹500 penalty)</span>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'monthly') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('daily')}
            className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Back to Daily View
          </button>
        </div>
        {generateMonthlyView()}
      </div>
    );
  }

  const isSelectedDateSunday = isSunday(selectedDate);
  const filteredAttendance = getFilteredAttendance();

  // Combine full-time and part-time staff for display
  const combinedAttendanceData = [
    // Full-time staff
    ...activeStaff.map((member, index) => ({
      id: member.id,
      serialNo: index + 1,
      name: member.name,
      location: member.location,
      type: member.type,
      shift: '-',
      status: getAttendanceForDate(member.id, selectedDate),
      isPartTime: false
    })),
    // Part-time staff
    ...attendance
      .filter(record => record.isPartTime && record.date === selectedDate)
      .map((record, index) => ({
        id: record.id,
        serialNo: activeStaff.length + index + 1,
        name: record.staffName || 'Unknown',
        location: record.location || 'Unknown',
        type: 'part-time',
        shift: record.shift || '-',
        status: record.status,
        isPartTime: true
      }))
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={32} />
            <h1 className="text-3xl font-bold">Attendance Tracker</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setView('monthly')}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              Monthly View
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isSelectedDateSunday && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Sunday - ₹500 penalty for absents
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onBulkUpdateAttendance(selectedDate, 'Present')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={16} />
              All Present
            </button>
            <button
              onClick={() => onBulkUpdateAttendance(selectedDate, 'Absent')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X size={16} />
              All Absent
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={filters.staffType}
            onChange={(e) => setFilters({ ...filters, staffType: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Staff</option>
            <option value="full-time">Full-Time Only</option>
            <option value="part-time">Part-Time Only</option>
          </select>
          <select
            value={filters.shift}
            onChange={(e) => setFilters({ ...filters, shift: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Both">Both</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {combinedAttendanceData.map((data) => (
                <tr key={data.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.serialNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{data.name}</div>
                      <div className="text-sm text-gray-500">{data.type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLocationColor(data.location)}`}>
                      {data.location}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.type === 'full-time' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {data.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {data.shift !== '-' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(data.shift)}`}>
                        {data.shift}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                      {data.status}
                      {data.status === 'Absent' && isSelectedDateSunday && !data.isPartTime && (
                        <span className="ml-1 text-red-600">⚠️</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {!data.isPartTime && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onUpdateAttendance(data.id, selectedDate, 'Present')}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            data.status === 'Present' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } transition-colors`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => onUpdateAttendance(data.id, selectedDate, 'Half Day')}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            data.status === 'Half Day' 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          } transition-colors`}
                        >
                          Half Day
                        </button>
                        <button
                          onClick={() => onUpdateAttendance(data.id, selectedDate, 'Absent')}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            data.status === 'Absent' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } transition-colors`}
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;