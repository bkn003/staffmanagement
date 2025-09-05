import React, { useState, useEffect } from 'react';
import { Calendar, Users, Download, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { Staff, Attendance } from '../types';
import { exportPartTimeStaffToExcel, exportPartTimeSalaryPDF } from '../utils/exportUtils';

interface PartTimeStaffProps {
  attendance: Attendance[];
  staff: Staff[];
  onUpdateAttendance: (
    staffId: string,
    date: string,
    status: 'Present' | 'Half Day' | 'Absent',
    isPartTime: boolean,
    staffName?: string,
    shift?: string,
    location?: string,
    salary?: number,
    salaryOverride?: boolean,
    arrivalTime?: string,
    leavingTime?: string
  ) => void;
  onDeletePartTimeAttendance: (attendanceId: string) => void;
  userLocation: string;
}

const PartTimeStaff: React.FC<PartTimeStaffProps> = ({
  attendance,
  staff,
  onUpdateAttendance,
  onDeletePartTimeAttendance,
  userLocation
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    location: userLocation,
    shift: 'Morning (Half Day)',
    arrivalTime: '',
    leavingTime: '',
    salary: 350
  });

  // Check if today is Sunday and set default shift
  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    if (isSunday && !editingAttendance) {
      setNewStaff(prev => ({
        ...prev,
        shift: 'Both (Full Day)'
      }));
    }
  }, [editingAttendance]);

  const partTimeAttendance = attendance.filter(att => att.is_part_time);
  const todayAttendance = partTimeAttendance.filter(att => att.date === selectedDate);

  const handleAddStaff = async () => {
    if (!newStaff.name.trim()) return;

    // Check for duplicate names across all locations for the selected date
    const existingNames = partTimeAttendance
      .filter(att => att.date === selectedDate)
      .map(att => att.staff_name?.toLowerCase().trim());
    
    if (existingNames.includes(newStaff.name.toLowerCase().trim())) {
      alert('A staff member with this name already exists for this date. Please use a different name.');
      return;
    }

    // Generate unique ID for part-time staff
    const staffId = crypto.randomUUID();
    
    // Extract base shift name (e.g., 'Morning' from 'Morning (Half Day)')
    const baseShift = newStaff.shift.split(' ')[0];

    await onUpdateAttendance(
      staffId,
      selectedDate,
      'Present',
      true,
      newStaff.name,
      baseShift,
      newStaff.location,
      newStaff.salary,
      false,
      newStaff.shift,
      newStaff.arrivalTime,
      newStaff.leavingTime
    );

    setNewStaff({
      name: '',
      location: userLocation,
      shift: new Date().getDay() === 0 ? 'Both (Full Day)' : 'Morning (Half Day)',
      arrivalTime: '',
      leavingTime: '',
      salary: 350
    });
    setShowAddForm(false);
  };

  const handleEditStaff = async () => {
    if (!editingAttendance || !newStaff.name.trim()) return;

    // Check for duplicate names across all locations for the selected date (excluding current record)
    const existingNames = partTimeAttendance
      .filter(att => att.date === selectedDate && att.id !== editingAttendance.id)
      .map(att => att.staff_name?.toLowerCase().trim());
    
    if (existingNames.includes(newStaff.name.toLowerCase().trim())) {
      alert('A staff member with this name already exists for this date. Please use a different name.');
      return;
    }

    // Extract base shift name (e.g., 'Morning' from 'Morning (Half Day)')
    const baseShift = newStaff.shift.split(' ')[0];

    await onUpdateAttendance(
      editingAttendance.staff_id,
      selectedDate,
      'Present',
      true,
      newStaff.name,
      baseShift,
      newStaff.location,
      newStaff.salary,
      false,
      newStaff.shift,
      newStaff.arrivalTime,
      newStaff.leavingTime
    );

    setEditingAttendance(null);
    setNewStaff({
      name: '',
      location: userLocation,
      shift: new Date().getDay() === 0 ? 'Both (Full Day)' : 'Morning (Half Day)',
      arrivalTime: '',
      leavingTime: '',
      salary: 350
    });
  };

  const startEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setNewStaff({
      name: attendance.staff_name || '',
      location: attendance.location || userLocation,
      shift: attendance.shift || 'Morning (Half Day)',
      arrivalTime: attendance.arrival_time || '',
      leavingTime: attendance.leaving_time || '',
      salary: attendance.salary || 350
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingAttendance(null);
    setNewStaff({
      name: '',
      location: userLocation,
      shift: new Date().getDay() === 0 ? 'Both (Full Day)' : 'Morning (Half Day)',
      arrivalTime: '',
      leavingTime: '',
      salary: 350
    });
    setShowAddForm(false);
  };

  const handleExportExcel = () => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 6);
    
    exportPartTimeStaffToExcel(partTimeAttendance, startDate, endDate);
  };

  const handleExportPDF = () => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 6);
    
    exportPartTimeSalaryPDF(partTimeAttendance, startDate, endDate);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Part-Time Staff Attendance</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Add Part-Time Staff for Today
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingAttendance ? 'Edit Part-Time Staff' : 'Add Part-Time Staff for Today'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={newStaff.location}
                  onChange={(e) => setNewStaff({ ...newStaff, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Big Shop">Big Shop</option>
                  <option value="Small Shop">Small Shop</option>
                  <option value="Godown">Godown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select
                  value={newStaff.shift}
                  onChange={(e) => setNewStaff({ ...newStaff, shift: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Morning (Half Day)">Morning (Half Day)</option>
                  <option value="Evening (Half Day)">Evening (Half Day)</option>
                  <option value="Both (Full Day)">Both (Full Day)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={newStaff.arrivalTime}
                  onChange={(e) => setNewStaff({ ...newStaff, arrivalTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leaving Time</label>
                <input
                  type="time"
                  value={newStaff.leavingTime}
                  onChange={(e) => setNewStaff({ ...newStaff, leavingTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₹)</label>
                <input
                  type="number"
                  value={newStaff.salary}
                  onChange={(e) => setNewStaff({ ...newStaff, salary: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={editingAttendance ? handleEditStaff : handleAddStaff}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {editingAttendance ? 'Update Staff' : 'Add Staff'}
              </button>
              {editingAttendance && (
                <button
                  onClick={cancelEdit}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">S.NO</th>
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">NAME</th>
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">LOCATION</th>
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">SHIFT</th>
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">STATUS</th>
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">SALARY</th>
                <th className="border border-gray-200 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                    No part-time staff attendance recorded for {selectedDate}
                  </td>
                </tr>
              ) : (
                todayAttendance.map((att, index) => (
                  <tr key={att.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 sm:px-4 py-3 text-xs sm:text-sm">{index + 1}</td>
                    <td className="border border-gray-200 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium">{att.staff_name}</td>
                    <td className="border border-gray-200 px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        att.location === 'Big Shop' ? 'bg-blue-100 text-blue-800' :
                        att.location === 'Small Shop' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {att.location}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          att.shift === 'Both (Full Day)' ? 'bg-green-100 text-green-800' :
                          att.shift === 'Morning (Half Day)' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {att.shift}
                        </span>
                        {att.arrival_time && att.leaving_time && (
                          <div className="text-xs text-gray-600">
                            In: {att.arrival_time} | Out: {att.leaving_time}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Present
                      </span>
                    </td>
                    <td className="border border-gray-200 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-green-600">
                      ₹{att.salary || 350}
                      {att.salary_override && <span className="text-orange-600 text-xs ml-1">(edited)</span>}
                    </td>
                    <td className="border border-gray-200 px-2 sm:px-4 py-3">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => startEdit(att)}
                          className="p-1 sm:p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePartTimeAttendance(att.id)}
                          className="p-1 sm:p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartTimeStaff;