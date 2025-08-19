import React, { useState } from 'react';
import { Staff, OldStaffRecord, SalaryHike } from '../types';
import { Users, Plus, Edit2, Trash2, Download, Archive, Calendar, TrendingUp } from 'lucide-react';
import { calculateExperience } from '../utils/salaryCalculations';
import SalaryHikeHistory from './SalaryHikeHistory';

interface StaffManagementProps {
  staff: Staff[];
  salaryHikes: SalaryHike[];
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onUpdateStaff: (id: string, staff: Partial<Staff>) => void;
  onDeleteStaff: (id: string, reason: string) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({
  staff,
  salaryHikes,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Staff | null>(null);
  const [showSalaryHistory, setShowSalaryHistory] = useState<Staff | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: 'Big Shop' as Staff['location'],
    basicSalary: 15000,
    incentive: 10000,
    hra: 0,
    joinedDate: ''
  });

  const activeStaff = staff.filter(member => member.isActive);

  const resetForm = () => {
    setFormData({
      name: '',
      location: 'Big Shop',
      basicSalary: 15000,
      incentive: 10000,
      hra: 0,
      joinedDate: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSalary = formData.basicSalary + formData.incentive + formData.hra;
    const experience = calculateExperience(formData.joinedDate);
    
    if (editingStaff) {
      onUpdateStaff(editingStaff.id, { 
        ...formData, 
        totalSalary,
        experience,
        type: 'full-time' // All staff are full-time by default
      });
      setEditingStaff(null);
    } else {
      onAddStaff({ 
        ...formData, 
        totalSalary, 
        experience,
        type: 'full-time', // All staff are full-time by default
        isActive: true,
        initialSalary: totalSalary
      });
      setShowAddForm(false);
    }
    resetForm();
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      location: staffMember.location,
      basicSalary: staffMember.basicSalary,
      incentive: staffMember.incentive,
      hra: staffMember.hra,
      joinedDate: staffMember.joinedDate
    });
    
    // Auto-scroll to the form at the top
    setTimeout(() => {
      const formElement = document.querySelector('.edit-staff-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = (staffMember: Staff) => {
    setShowDeleteModal(staffMember);
    setDeleteReason('');
  };

  const confirmDelete = () => {
    if (showDeleteModal && deleteReason.trim()) {
      onDeleteStaff(showDeleteModal.id, deleteReason);
      setShowDeleteModal(null);
      setDeleteReason('');
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

  const getStaffSalaryHikes = (staffId: string) => {
    return salaryHikes.filter(hike => hike.staffId === staffId);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <h1 className="page-title text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600 md:w-8 md:h-8" size={24} />
          Staff Management
        </h1>
        <div className="header-actions flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="mobile-full-button flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingStaff) && (
        <div className="edit-staff-form bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
            {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <form onSubmit={handleSubmit} className="form-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as Staff['location'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Big Shop">Big Shop</option>
                <option value="Small Shop">Small Shop</option>
                <option value="Godown">Godown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
              <input
                type="date"
                value={formData.joinedDate}
                onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
              <input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incentive</label>
              <input
                type="number"
                value={formData.incentive}
                onChange={(e) => setFormData({ ...formData, incentive: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
              <input
                type="number"
                value={formData.hra}
                onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 form-actions flex gap-3">
              <button
                type="submit"
                className="mobile-full-button px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStaff(null);
                  resetForm();
                }}
                className="mobile-full-button px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-container bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Archive className="text-red-600" size={20} />
              Archive Staff Member
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to archive <strong>{showDeleteModal.name}</strong>? 
              This will move them to Old Staff Records.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for leaving</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Resigned - Better opportunity, Terminated - Performance issues"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>
            <div className="form-actions flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={!deleteReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Archive Staff
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

      {/* Salary History Modal */}
      {showSalaryHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-container bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={24} />
                Salary Hike History
              </h3>
              <button
                onClick={() => setShowSalaryHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <SalaryHikeHistory
              salaryHikes={getStaffSalaryHikes(showSalaryHistory.id)}
              staffName={showSalaryHistory.name}
              currentSalary={showSalaryHistory.totalSalary}
              staff={showSalaryHistory}
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSalaryHistory(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Active Staff ({activeStaff.length})
          </h2>
        </div>
        <div className="table-container overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incentive</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HRA</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary History</th>
                <th className="px-3 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeStaff.map((member, index) => {
                const memberHikes = getStaffSalaryHikes(member.id);
                const hasHikes = memberHikes.length > 0;
                
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          Joined: {new Date(member.joinedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLocationColor(member.location)}`}>
                        {member.location}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {calculateExperience(member.joinedDate)}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{member.basicSalary.toLocaleString()}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{member.incentive.toLocaleString()}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{member.hra.toLocaleString()}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{member.totalSalary.toLocaleString()}</td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setShowSalaryHistory(member)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                          hasHikes 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <TrendingUp size={12} />
                        {hasHikes ? `${memberHikes.length} hikes` : 'No hikes'}
                      </button>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit staff member"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Archive staff member"
                        >
                          <Archive size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;