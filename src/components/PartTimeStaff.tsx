import React, { useState } from 'react';
import { Attendance, PartTimeSalaryDetail } from '../types';
import { Clock, Plus, Download, Calendar, DollarSign, Edit2, Save, X } from 'lucide-react';
import { calculatePartTimeSalary, getPartTimeDailySalary, isSunday } from '../utils/salaryCalculations';
import { exportSalaryToExcel, exportSalaryPDF } from '../utils/exportUtils';

interface PartTimeStaffProps {
  attendance: Attendance[];
  onUpdateAttendance: (staffId: string, date: string, status: 'Present' | 'Half Day' | 'Absent', isPartTime?: boolean, staffName?: string, shift?: 'Morning' | 'Evening' | 'Both', location?: string, salary?: number, salaryOverride?: boolean) => void;
}

const PartTimeStaff: React.FC<PartTimeStaffProps> = ({
  attendance,
  onUpdateAttendance
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState<number>(0);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    location: 'Big Shop' as 'Big Shop' | 'Small Shop' | 'Godown',
    shift: 'Morning' as 'Morning' | 'Evening' | 'Both'
  });

  // Get unique part-time staff for the selected month
  const getPartTimeStaffForMonth = () => {
    const monthlyAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return record.isPartTime && 
             recordDate.getMonth() === selectedMonth && 
             recordDate.getFullYear() === selectedYear;
    });

    const uniqueStaff = new Map();
    monthlyAttendance.forEach(record => {
      if (record.staffName) {
        uniqueStaff.set(record.staffName, {
          name: record.staffName,
          location: record.location || 'Unknown'
        });
      }
    });

    return Array.from(uniqueStaff.values());
  };

  // Calculate part-time salaries
  const calculatePartTimeSalaries = (): PartTimeSalaryDetail[] => {
    const partTimeStaff = getPartTimeStaffForMonth();
    return partTimeStaff.map(staff => 
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
  const todayPartTimeAttendance = attendance.filter(record => 
    record.isPartTime && record.date === selectedDate
  );

  const handleAddPartTimeAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const staffId = `pt_${Date.now()}`;
    const defaultSalary = getPartTimeDailySalary(selectedDate);
    
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
    setNewStaffData({ name: '', location: 'Big Shop', shift: 'Morning' });
    setShowAddForm(false);
  };

  const handleEditSalary = (attendanceId: string, currentSalary: number) => {
    setEditingAttendance(attendanceId);
    setEditSalary(currentSalary);
  };

  const handleSaveSalary = (attendanceRecord: Attendance) => {
    onUpdateAttendance(
      attendanceRecord.staffId,
      attendanceRecord.date,
      attendanceRecord.status,
      true,
      attendanceRecord.staffName,
      attendanceRecord.shift,
      attendanceRecord.location,
      editSalary,
      true
    );
    setEditingAttendance(null);
  };

  const handleCancelEdit = () => {
    setEditingAttendance(null);
    setEditSalary(0);
  };

  const handleExportExcel = () => {
    exportSalaryToExcel([], partTimeSalaries, [], selectedMonth, selectedYear);
  };

  const handleExportPDF = () => {
    exportSalaryPDF([], partTimeSalaries, [], selectedMonth, selectedYear);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={32} />
            <h1 className="text-3xl font-bold">Part-Time Staff Management</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <Download size={16} />
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
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Both">Both</option>
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
        </div>
      </div>

      {/* Today's Part-Time Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="text-purple-600" size={20} />
            Part-Time Staff Attendance - {new Date(selectedDate).toLocaleDateString()}
          </h2>
        </div>
        
        {todayPartTimeAttendance.length === 0 ? (
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
                {todayPartTimeAttendance.map((record, index) => (
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
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editSalary}
                            onChange={(e) => setEditSalary(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                            min="0"
                          />
                          <button
                            onClick={() => handleSaveSalary(record)}
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
                        <button
                          onClick={() => handleEditSalary(record.id, record.salary || getPartTimeDailySalary(record.date))}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit salary"
                        >
                          <Edit2 size={14} />
                        </button>
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

        {/* Salary Table */}
        {partTimeSalaries.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No part-time staff data</h3>
            <p className="text-gray-500">Part-time staff salary data will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Breakdown</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partTimeSalaries.map((salary, index) => (
                  <tr key={`${salary.staffName}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {salary.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {salary.location}
                      </span>
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
        )}
      </div>
    </div>
  );
};

export default PartTimeStaff;