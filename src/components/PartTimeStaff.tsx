import React, { useState } from 'react';
import { Attendance, PartTimeSalaryDetail } from '../types';
import { Clock, Plus, Download, Calendar, DollarSign, Edit2, Save, X, FileSpreadsheet, Trash2 } from 'lucide-react';
import { calculatePartTimeSalary, getPartTimeDailySalary, isSunday } from '../utils/salaryCalculations';
import { exportSalaryToExcel, exportSalaryPDF } from '../utils/exportUtils';

interface PartTimeStaffProps {
  attendance: Attendance[];
  onUpdateAttendance: (staffId: string, date: string, status: 'Present' | 'Half Day' | 'Absent', isPartTime?: boolean, staffName?: string, shift?: 'Morning' | 'Evening' | 'Both', location?: string, salary?: number, salaryOverride?: boolean) => void;
  userLocation?: string;
}

const PartTimeStaff: React.FC<PartTimeStaffProps> = ({
  attendance,
  onUpdateAttendance,
  userLocation
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    name: string;
    location: string;
    shift: string;
    status: string;
    salary: number;
  }>({
    name: '',
    location: '',
    shift: '',
    status: '',
    salary: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<'All' | 'Big Shop' | 'Small Shop' | 'Godown'>(
    userLocation ? userLocation as any : 'All'
  );
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    location: (userLocation || 'Big Shop') as 'Big Shop' | 'Small Shop' | 'Godown',
    shift: 'Morning' as 'Morning' | 'Evening' | 'Both'
  });

  const today = new Date().toISOString().split('T')[0];

  // Get current week's Monday
  const getCurrentWeekMonday = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  // Calculate part-time salaries for the selected month
  const calculatePartTimeSalaries = (): PartTimeSalaryDetail[] => {
    let monthlyAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return record.isPartTime && 
             recordDate.getMonth() === selectedMonth && 
             recordDate.getFullYear() === selectedYear;
    });

    // Filter by user location if manager
    if (userLocation) {
      monthlyAttendance = monthlyAttendance.filter(record => record.location === userLocation);
    }

    const uniqueStaff = new Map();
    monthlyAttendance.forEach(record => {
      if (record.staffName) {
        const key = `${record.staffName}-${record.location}`;
        uniqueStaff.set(key, {
          name: record.staffName,
          location: record.location || 'Unknown'
        });
      }
    });

    return Array.from(uniqueStaff.values()).map(staff => 
      calculatePartTimeSalary(
        staff.name,
        staff.location,
        attendance,
        selectedYear,
        selectedMonth
      )
    );
  };

  const partTimeSalaries = calculatePartTimeSalaries();
  const totalPartTimeEarnings = partTimeSalaries.reduce((sum, salary) => sum + salary.totalEarnings, 0);

  // Get today's part-time attendance
  let todayPartTimeAttendance = attendance.filter(record => 
    record.isPartTime && record.date === selectedDate
  );

  // Filter by user location if manager
  if (userLocation) {
    todayPartTimeAttendance = todayPartTimeAttendance.filter(record => record.location === userLocation);
  }

  // Filter by location
  const filteredTodayAttendance = locationFilter === 'All' 
    ? todayPartTimeAttendance 
    : todayPartTimeAttendance.filter(record => record.location === locationFilter);

  const handleAddPartTimeAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const staffId = `pt_${Date.now()}`;
    
    // Calculate salary based on shift and day
    let defaultSalary = getPartTimeDailySalary(selectedDate);
    if (newStaffData.shift === 'Morning' || newStaffData.shift === 'Evening') {
      defaultSalary = Math.round(defaultSalary / 2); // Half day rate
    }
    
    onUpdateAttendance(
      staffId,
      selectedDate,
      'Present',
      true,
      newStaffData.name,
      newStaffData.shift,
      newStaffData.location,
      defaultSalary,
      false
    );
    setNewStaffData({ 
      name: '', 
      location: (userLocation || 'Big Shop') as any, 
      shift: 'Morning' 
    });
    setShowAddForm(false);
  };

  const handleEdit = (record: Attendance) => {
    setEditingAttendance(record.id);
    setEditData({
      name: record.staffName || '',
      location: record.location || 'Big Shop',
      shift: record.shift || 'Morning',
      status: record.status,
      salary: record.salary || getPartTimeDailySalary(record.date)
    });
  };

  const handleSave = (attendanceRecord: Attendance) => {
    onUpdateAttendance(
      attendanceRecord.staffId,
      attendanceRecord.date,
      editData.status as 'Present' | 'Half Day' | 'Absent',
      true,
      editData.name,
      editData.shift as 'Morning' | 'Evening' | 'Both',
      editData.location,
      editData.salary,
      true
    );
    setEditingAttendance(null);
  };

  const handleCancelEdit = () => {
    setEditingAttendance(null);
  };

  const handleDelete = (attendanceId: string) => {
    setShowDeleteModal(attendanceId);
  };

  const confirmDelete = () => {
    if (showDeleteModal) {
      const record = filteredTodayAttendance.find(r => r.id === showDeleteModal);
      if (record) {
        onUpdateAttendance(
          record.staffId,
          record.date,
          'Absent',
          true,
          record.staffName,
          record.shift,
          record.location,
          0,
          false
        );
      }
      setShowDeleteModal(null);
    }
  };

  const handleExportExcel = () => {
    exportSalaryToExcel([], partTimeSalaries, [], selectedMonth, selectedYear);
  };

  const handleExportPDF = () => {
    exportSalaryPDF([], partTimeSalaries, [], selectedMonth, selectedYear);
  };

  // Group salaries by location for display
  const salariesByLocation = partTimeSalaries.reduce((acc, salary) => {
    if (!acc[salary.location]) {
      acc[salary.location] = [];
    }
    acc[salary.location].push(salary);
    return acc;
  }, {} as Record<string, PartTimeSalaryDetail[]>);

  // Filter locations based on user role
  const getAvailableLocations = () => {
    if (userLocation) {
      return [userLocation];
    }
    return ['All', 'Big Shop', 'Small Shop', 'Godown'];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={32} />
            <h1 className="text-3xl font-bold">Part-Time Staff Management</h1>
            {userLocation && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {userLocation}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <Download size={16} />
              Export PDF
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <Plus size={16} />
              Add Part-Time Staff
            </button>
          </div>
        </div>
      </div>

      {/* Add Part-Time Staff Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add Part-Time Staff for Today</h2>
          <form onSubmit={handleAddPartTimeAttendance} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newStaffData.name}
                onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={newStaffData.location}
                onChange={(e) => setNewStaffData({ ...newStaffData, location: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={!!userLocation}
              >
                <option value="Big Shop">Big Shop</option>
                <option value="Small Shop">Small Shop</option>
                <option value="Godown">Godown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select
                value={newStaffData.shift}
                onChange={(e) => setNewStaffData({ ...newStaffData, shift: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Morning">Morning (Half Day)</option>
                <option value="Evening">Evening (Half Day)</option>
                <option value="Both">Both (Full Day)</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Staff
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Date Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {isSunday(selectedDate) && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                Sunday - ₹400 rate
              </span>
            )}
          </div>
          {!userLocation && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {getAvailableLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Today's Part-Time Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="text-purple-600" size={20} />
            Part-Time Staff Attendance - {new Date(selectedDate).toLocaleDateString()}
            {(locationFilter !== 'All' || userLocation) && (
              <span className="text-sm text-gray-500">
                ({userLocation || locationFilter})
              </span>
            )}
          </h2>
        </div>
        
        {filteredTodayAttendance.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No part-time staff for today</h3>
            <p className="text-gray-500">Add part-time staff using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTodayAttendance.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {record.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {record.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingAttendance === record.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) => setEditData({...editData, name: e.target.value})}
                              className="px-2 py-1 text-xs border rounded"
                              placeholder="Name"
                            />
                            <select
                              value={editData.location}
                              onChange={(e) => setEditData({...editData, location: e.target.value})}
                              className="px-2 py-1 text-xs border rounded"
                            >
                              <option value="Big Shop">Big Shop</option>
                              <option value="Small Shop">Small Shop</option>
                              <option value="Godown">Godown</option>
                            </select>
                            <select
                              value={editData.shift}
                              onChange={(e) => setEditData({...editData, shift: e.target.value})}
                              className="px-2 py-1 text-xs border rounded"
                            >
                              <option value="Morning">Morning</option>
                              <option value="Evening">Evening</option>
                              <option value="Both">Both</option>
                            </select>
                            <select
                              value={editData.status}
                              onChange={(e) => setEditData({...editData, status: e.target.value})}
                              className="px-2 py-1 text-xs border rounded"
                            >
                              <option value="Present">Present</option>
                              <option value="Half Day">Half Day</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editData.salary}
                              onChange={(e) => setEditData({...editData, salary: Number(e.target.value)})}
                              className="w-20 px-2 py-1 text-xs border rounded"
                              min="0"
                            />
                            <button
                              onClick={() => handleSave(record)}
                              className="text-green-600 hover:text-green-800 p-1"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${record.salaryOverride ? 'text-orange-600' : 'text-green-600'}`}>
                            ₹{record.salary || getPartTimeDailySalary(record.date)}
                          </span>
                          {record.salaryOverride && (
                            <span className="text-xs text-orange-600">(edited)</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingAttendance !== record.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit record"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Salary Report */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="text-green-600" size={20} />
            Part-Time Staff Salary Report
            {userLocation && (
              <span className="text-sm text-gray-500">- {userLocation}</span>
            )}
          </h2>
          <div className="flex gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-1">Total Part-Time Earnings</p>
              <p className="text-3xl font-bold">₹{totalPartTimeEarnings.toLocaleString()}</p>
              <p className="text-green-100 text-sm">
                For {new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })} {selectedYear}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-100 mb-1">Total Staff</p>
              <p className="text-2xl font-bold">{partTimeSalaries.length}</p>
              <p className="text-green-100 text-sm">Mon-Sat: ₹350 | Sun: ₹400</p>
            </div>
          </div>
        </div>

        {/* Location-wise Salary Display */}
        {Object.keys(salariesByLocation).length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No part-time staff data</h3>
            <p className="text-gray-500">Part-time staff salary data will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(salariesByLocation).map(([location, salaries]) => {
              const locationTotal = salaries.reduce((sum, salary) => sum + salary.totalEarnings, 0);
              const locationDays = salaries.reduce((sum, salary) => sum + salary.totalDays, 0);
              
              return (
                <div key={location} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">{location}</h3>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Total Salary</p>
                          <p className="font-bold text-green-600">₹{locationTotal.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Total Days</p>
                          <p className="font-bold text-blue-600">{locationDays}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Staff Count</p>
                          <p className="font-bold text-purple-600">{salaries.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Breakdown</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salaries.map((salary, index) => (
                          <tr key={`${salary.staffName}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {salary.staffName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {salary.totalDays}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              <div className="space-y-1">
                                {salary.weeklyBreakdown.map(week => (
                                  <div key={week.week} className="text-xs">
                                    Week {week.week}: {week.days.length} days - ₹{week.weekTotal}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-green-600">
                              ₹{salary.totalEarnings.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this part-time attendance record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartTimeStaff;