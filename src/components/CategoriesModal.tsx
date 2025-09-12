import React, { useState } from 'react';
import { Settings, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { Category, SalaryCategory } from '../types';
import { defaultLocationCategories, defaultSalaryCategories } from '../data/categories';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategories: (locations: Category[], salaryCategories: SalaryCategory[]) => void;
  currentLocationCategories: Category[];
  currentSalaryCategories: SalaryCategory[];
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  onUpdateCategories,
  currentLocationCategories,
  currentSalaryCategories
}) => {
  const [activeTab, setActiveTab] = useState<'locations' | 'salary'>('locations');
  const [locationCategories, setLocationCategories] = useState<Category[]>(currentLocationCategories);
  const [salaryCategories, setSalaryCategories] = useState<SalaryCategory[]>(currentSalaryCategories);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editingSalary, setEditingSalary] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newSalaryData, setNewSalaryData] = useState({
    name: '',
    basicSalary: 15000,
    incentive: 10000,
    hra: 0
  });

  if (!isOpen) return null;

  const handleAddLocation = () => {
    if (newLocationName.trim()) {
      const newLocation: Category = {
        id: `loc-${Date.now()}`,
        name: newLocationName.trim(),
        type: 'location',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setLocationCategories([...locationCategories, newLocation]);
      setNewLocationName('');
    }
  };

  const handleAddSalaryCategory = () => {
    if (newSalaryData.name.trim()) {
      const totalSalary = newSalaryData.basicSalary + newSalaryData.incentive + newSalaryData.hra;
      const newSalaryCategory: SalaryCategory = {
        id: `sal-${Date.now()}`,
        name: newSalaryData.name.trim(),
        basicSalary: newSalaryData.basicSalary,
        incentive: newSalaryData.incentive,
        hra: newSalaryData.hra,
        totalSalary,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setSalaryCategories([...salaryCategories, newSalaryCategory]);
      setNewSalaryData({ name: '', basicSalary: 15000, incentive: 10000, hra: 0 });
    }
  };

  const handleUpdateLocation = (id: string, name: string) => {
    setLocationCategories(locationCategories.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ));
    setEditingLocation(null);
  };

  const handleUpdateSalaryCategory = (id: string, data: Partial<SalaryCategory>) => {
    setSalaryCategories(salaryCategories.map(cat => 
      cat.id === id ? { 
        ...cat, 
        ...data, 
        totalSalary: (data.basicSalary || cat.basicSalary) + (data.incentive || cat.incentive) + (data.hra || cat.hra)
      } : cat
    ));
    setEditingSalary(null);
  };

  const handleDeleteLocation = (id: string) => {
    setLocationCategories(locationCategories.filter(cat => cat.id !== id));
  };

  const handleDeleteSalaryCategory = (id: string) => {
    setSalaryCategories(salaryCategories.filter(cat => cat.id !== id));
  };

  const handleSave = () => {
    onUpdateCategories(locationCategories, salaryCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="text-blue-600" size={24} />
              Manage Categories
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'locations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'salary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Salary Categories
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'locations' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Location</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Enter location name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Location
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Current Locations</h3>
                {locationCategories.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    {editingLocation === location.id ? (
                      <input
                        type="text"
                        defaultValue={location.name}
                        onBlur={(e) => handleUpdateLocation(location.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateLocation(location.id, e.currentTarget.value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{location.name}</span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingLocation(location.id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                    {editingSalary === category.id && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setEditingSalary(null)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSalary(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Salary Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                    <input
                      type="text"
                      value={newSalaryData.name}
                      onChange={(e) => setNewSalaryData({ ...newSalaryData, name: e.target.value })}
                      placeholder="e.g., Senior Level"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                    <input
                      type="number"
                      value={newSalaryData.basicSalary}
                      onChange={(e) => setNewSalaryData({ ...newSalaryData, basicSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incentive</label>
                    <input
                      type="number"
                      value={newSalaryData.incentive}
                      onChange={(e) => setNewSalaryData({ ...newSalaryData, incentive: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                    <input
                      type="number"
                      value={newSalaryData.hra}
                      onChange={(e) => setNewSalaryData({ ...newSalaryData, hra: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Total: ₹{(newSalaryData.basicSalary + newSalaryData.incentive + newSalaryData.hra).toLocaleString()}
                  </div>
                  <button
                    onClick={handleAddSalaryCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Category
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Current Salary Categories</h3>
                {salaryCategories.map((category) => (
                  <div key={category.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      {editingSalary === category.id ? (
                        <input
                          type="text"
                          defaultValue={category.name}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleUpdateSalaryCategory(category.id, { name: e.target.value.trim() });
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              handleUpdateSalaryCategory(category.id, { name: e.currentTarget.value.trim() });
                            }
                          }}
                          className="font-semibold text-gray-800 bg-transparent border-b border-blue-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <h4 className="font-semibold text-gray-800">{category.name}</h4>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSalary(category.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSalaryCategory(category.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {editingSalary === category.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <label className="block text-gray-600 mb-1">Basic Salary:</label>
                          <input
                            type="number"
                            defaultValue={category.basicSalary}
                            onBlur={(e) => handleUpdateSalaryCategory(category.id, { basicSalary: Number(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">Incentive:</label>
                          <input
                            type="number"
                            defaultValue={category.incentive}
                            onBlur={(e) => handleUpdateSalaryCategory(category.id, { incentive: Number(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">HRA:</label>
                          <input
                            type="number"
                            defaultValue={category.hra}
                            onBlur={(e) => handleUpdateSalaryCategory(category.id, { hra: Number(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Basic:</span>
                          <div className="font-medium">₹{category.basicSalary.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Incentive:</span>
                          <div className="font-medium">₹{category.incentive.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">HRA:</span>
                          <div className="font-medium">₹{category.hra.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <div className="font-bold text-green-600">₹{category.totalSalary.toLocaleString()}</div>
                        </div>
                      </div>
                    )}