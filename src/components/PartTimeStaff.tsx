import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, DollarSign, Download, FileText, Plus, X } from 'lucide-react';
import { Staff, PartTimeAttendance } from '../types';
import { attendanceService } from '../services/attendanceService';
import { exportPartTimeSalaryPDF, exportPartTimeSalaryExcel } from '../utils/exportUtils';

interface PartTimeStaffProps {
  staff: Staff[];
  attendance: any[];
  onUpdateAttendance: (staffId: string, date: string, status: 'Present' | 'Half Day' | 'Absent', isPartTime?: boolean, staffName?: string, shift?: 'Morning' | 'Evening' | 'Both', location?: string, salary?: number, salaryOverride?: boolean, arrivalTime?: string, leavingTime?: string) => void;
  onDeletePartTimeAttendance: (attendanceId: string) => void;
  userLocation?: string;
}

export default function PartTimeStaff({ 
  staff, 
  attendance, 
  onUpdateAttendance, 
  onDeletePartTimeAttendance, 
  userLocation 
}: PartTimeStaffProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locationFilter, setLocationFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    location: 'Big Shop' as 'Big Shop' | 'Small Shop' | 'Godown',
    shift: 'Morning' as 'Morning' | 'Evening' | 'Both',
    arrivalTime: '',
    leavingTime: '',
    salary: 350
  });

  const partTimeStaff = staff.filter(s => s.type === 'part-time');

  useEffect(() => {
    const currentDate = new Date();
    setSelectedMonth(currentDate.toLocaleString('default', { month: 'long' }));
    setSelectedYear(currentDate.getFullYear().toString());
    
    // Set default week
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    setSelectedWeek(`Week ${Math.ceil(currentDate.getDate() / 7)}: ${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`);
  }, []);

  const handleAddPartTimeStaff = () => {
    if (!formData.name.trim()) {
      alert('Please enter staff name');
      return;
    }

    const salary = formData.shift === 'Both' ? formData.salary * 2 : formData.salary;
    
    onUpdateAttendance(
      `pt-${Date.now()}`, // Generate unique ID for part-time staff
      selectedDate,
      'Present',
      true, // isPartTime
      formData.name,
      formData.shift,
      formData.location,
      salary,
      false, // salaryOverride
      formData.arrivalTime,
      formData.leavingTime
    );

    // Reset form
    setFormData({
      name: '',
      location: 'Big Shop',
      shift: 'Morning',
      arrivalTime: '',
      leavingTime: '',
      salary: 350
    });
    setShowAddForm(false);
  };

  const getWeekOptions = () => {
    const weeks = [];
    const currentDate = new Date();
    const year = parseInt(selectedYear);
    const monthIndex = new Date(`${selectedMonth} 1, ${year}`).getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    let weekStart = new Date(firstDay);
    weekStart.setDate(firstDay.getDate() - firstDay.getDay());
    
    let weekNumber = 1;
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        value: `Week ${weekNumber}: ${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`,
        label: `Week ${weekNumber}: ${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
      });
      
      weekStart.setDate(weekStart.getDate() + 7);
      weekNumber++;
    }
    
    return weeks;
  };

  // Get today's part-time attendance
  const getTodayPartTimeAttendance = () => {
    return attendance.filter(record => 
      record.isPartTime && 
      record.date === selectedDate &&
      (locationFilter === 'All' || record.location === locationFilter)
    );
  };

  const calculateTotalEarnings = () => {
    return attendance.reduce((total, record) => {
      const staffMember = partTimeStaff.find(s => s.id === record.staffId);
      if (staffMember) {
        const hoursWorked = record.hoursWorked || 0;
        const hourlyRate = staffMember.hourlyRate || 0;
        return total + (hoursWorked * hourlyRate);
      }
      return total;
    }, 0);
  };

  const getStaffAttendance = (staffId: string) => {
    return attendance.filter(record => record.staffId === staffId);
  };

  const calculateStaffEarnings = (staffId: string) => {
    const staffAttendance = getStaffAttendance(staffId);
    const staffMember = partTimeStaff.find(s => s.id === staffId);
    
    if (!staffMember) return 0;
    
    return staffAttendance.reduce((total, record) => {
      const hoursWorked = record.hoursWorked || 0;
      const hourlyRate = staffMember.hourlyRate || 0;
      return total + (hoursWorked * hourlyRate);
    }, 0);
  };

  const formatShiftTiming = (record: PartTimeAttendance) => {
    const date = new Date(record.date);
    const dateStr = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
    
    const shift = record.shift || 'Day';
    const checkIn = record.checkIn || '--:--';
    const checkOut = record.checkOut || '--:--';
    
    return `${shift}(${dateStr}) In: ${checkIn} | Out: ${checkOut}`;
  };

  const groupStaffByLocation = () => {
    const grouped: { [key: string]: Staff[] } = {};
    
    partTimeStaff.forEach(staff => {
      const location = staff.location || 'Unassigned';
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(staff);
    });
    
    return grouped;
  };

  const handleExportPDF = () => {
    const reportData = {
      period: selectedPeriod,
      week: selectedWeek,
      month: selectedMonth,
      year: selectedYear,
      staff: partTimeStaff,
      attendance: attendance,
      totalEarnings: calculateTotalEarnings()
    };
    
    exportPartTimeSalaryPDF(reportData);
  };

  const handleExportExcel = () => {
    const reportData = {
      period: selectedPeriod,
      week: selectedWeek,
      month: selectedMonth,
      year: selectedYear,
      staff: partTimeStaff,
      attendance: attendance,
      totalEarnings: calculateTotalEarnings()
    };
    
    exportPartTimeSalaryExcel(reportData);
  };

  const totalEarnings = calculateTotalEarnings();
  const groupedStaff = groupStaffByLocation();
  const todayPartTimeAttendance = getTodayPartTimeAttendance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Part-Time Staff Management</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Part-Time Staff</span>
            <span className="sm:hidden">Add Staff</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Add Part-Time Staff Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Add Part-Time Staff for Today</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter staff name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Big Shop">Big Shop</option>
                <option value="Small Shop">Small Shop</option>
                <option value="Godown">Godown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Morning">Morning (Half Day)</option>
                <option value="Evening">Evening (Half Day)</option>
                <option value="Both">Both (Full Day)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leaving Time</label>
              <input
                type="time"
                value={formData.leavingTime}
                onChange={(e) => setFormData({ ...formData, leavingTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Salary</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAddPartTimeStaff}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Staff
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Date Selection and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Big Shop">Big Shop</option>
                <option value="Small Shop">Small Shop</option>
                <option value="Godown">Godown</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Part-Time Staff Attendance for Selected Date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-purple-500 text-white p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Part-Time Staff Attendance - {new Date(selectedDate).toLocaleDateString()}
          </h2>
        </div>
        
        {todayPartTimeAttendance.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No part-time staff for today</h3>
            <p className="text-gray-500">Add part-time staff using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayPartTimeAttendance.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.staffName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {record.location}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {record.shift}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.arrivalTime && record.leavingTime ? (
                        <div>
                          <div>In: {record.arrivalTime}</div>
                          <div>Out: {record.leavingTime}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{record.salary || 350}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => onDeletePartTimeAttendance(record.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete attendance"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Period Selection */}
      <div className="flex flex-col sm:flex-row gap-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Part-Time Staff Salary Report
        </h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        {selectedPeriod === 'weekly' && (
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
          >
            {getWeekOptions().map((week) => (
              <option key={week.value} value={week.value}>
                {week.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const month = new Date(0, i).toLocaleString('default', { month: 'long' });
            return (
              <option key={month} value={month}>
                {month}
              </option>
            );
          })}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - 2 + i;
            return (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            );
          })}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="bg-green-500 text-white p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Total Part-Time Earnings</h2>
            <p className="text-3xl font-bold">₹{totalEarnings}</p>
            <p className="text-green-100">For {selectedMonth} {selectedYear}</p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <h3 className="text-lg font-semibold">Total Staff</h3>
            <p className="text-2xl font-bold">{partTimeStaff.length}</p>
            <p className="text-green-100">Mon-Sat: ₹350 | Sun: ₹400</p>
          </div>
        </div>
      </div>

      {/* Staff by Location */}
      {Object.entries(groupedStaff).map(([location, locationStaff]) => {
        const locationTotalSalary = locationStaff.reduce((total, staff) => total + calculateStaffEarnings(staff.id), 0);
        const locationTotalDays = locationStaff.reduce((total, staff) => {
          const staffAttendance = getStaffAttendance(staff.id);
          return total + staffAttendance.length;
        }, 0);

        return (
          <div key={location} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">{location}</h3>
                <div className="flex gap-6 text-sm text-gray-600">
                  <span>Total Salary: <span className="font-semibold text-green-600">₹{locationTotalSalary}</span></span>
                  <span>Total Days: <span className="font-semibold">{locationTotalDays}</span></span>
                  <span>Staff Count: <span className="font-semibold">{locationStaff.length}</span></span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift & Timing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Breakdown</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locationStaff.map((staff, index) => {
                    const staffAttendance = getStaffAttendance(staff.id);
                    const totalEarnings = calculateStaffEarnings(staff.id);
                    
                    return (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {staffAttendance.length}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {staffAttendance.length > 0 ? (
                            <div className="space-y-1">
                              {staffAttendance.slice(0, 2).map((record, idx) => (
                                <div key={idx} className="text-xs">
                                  {formatShiftTiming(record)}
                                </div>
                              ))}
                              {staffAttendance.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{staffAttendance.length - 2} more...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No attendance</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          Week 2: {staffAttendance.length} days - ₹{totalEarnings}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₹{totalEarnings}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {partTimeStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Part-Time Staff Found</h3>
          <p className="text-gray-500">Add part-time staff members to see their salary reports here.</p>
        </div>
      )}
    </div>
  );
}