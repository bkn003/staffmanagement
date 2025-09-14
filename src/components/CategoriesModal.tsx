import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, XCircle } from 'lucide-react';

interface Location {
  id: string;
  name: string;
}

interface SalaryCategory {
  id: string;
  name: string;
  basicSalary: number;
  incentive: number;
  hra: number;
  total: number;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [salaryCategories, setSalaryCategories] = useState<SalaryCategory[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState({
    name: '',
    basicSalary: 0,
    incentive: 0,
    hra: 0
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryData, setEditingCategoryData] = useState<SalaryCategory | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const savedLocations = localStorage.getItem('locations');
    const savedCategories = localStorage.getItem('salaryCategories');
    
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    } else {
      const defaultLocations = [
        { id: '1', name: 'Big Shop' },
        { id: '2', name: 'Small Shop' },
        { id: '3', name: 'Godown' }
      ];
      setLocations(defaultLocations);
      localStorage.setItem('locations', JSON.stringify(defaultLocations));
    }

    if (savedCategories) {
      setSalaryCategories(JSON.parse(savedCategories));
    } else {
      const defaultCategories = [
        { id: '1', name: 'Entry Level', basicSalary: 15000, incentive: 8000, hra: 0, total: 23000 },
        { id: '2', name: 'Experienced', basicSalary: 15000, incentive: 10000, hra: 5000, total: 30000 },
        { id: '3', name: 'Senior', basicSalary: 18000, incentive: 12000, hra: 5000, total: 35000 }
      ];
      setSalaryCategories(defaultCategories);
      localStorage.setItem('salaryCategories', JSON.stringify(defaultCategories));
    }
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      const newLoc = {
        id: Date.now().toString(),
        name: newLocation.trim()
      };
      const updatedLocations = [...locations, newLoc];
      setLocations(updatedLocations);
      localStorage.setItem('locations', JSON.stringify(updatedLocations));
      setNewLocation('');
    }
  };

  const deleteLocation = (id: string) => {
    const updatedLocations = locations.filter(loc => loc.id !== id);
    setLocations(updatedLocations);
    localStorage.setItem('locations', JSON.stringify(updatedLocations));
  };

  const addSalaryCategory = () => {
    if (newCategory.name.trim()) {
      const total = newCategory.basicSalary + newCategory.incentive + newCategory.hra;
      const category = {
        id: Date.now().toString(),
        name: newCategory.name.trim(),
        basicSalary: newCategory.basicSalary,
        incentive: newCategory.incentive,
        hra: newCategory.hra,
        total
      };
      const updatedCategories = [...salaryCategories, category];
      setSalaryCategories(updatedCategories);
      localStorage.setItem('salaryCategories', JSON.stringify(updatedCategories));
      setNewCategory({ name: '', basicSalary: 0, incentive: 0, hra: 0 });
    }
  };

  const startEditCategory = (category: SalaryCategory) => {
    setEditingCategory(category.id);
    setEditingCategoryData({ ...category });
  };

  const saveEditCategory = () => {
    if (editingCategoryData) {
      const total = editingCategoryData.basicSalary + editingCategoryData.incentive + editingCategoryData.hra;
      const updatedCategory = { ...editingCategoryData, total };
      const updatedCategories = salaryCategories.map(cat => 
        cat.id === editingCategory ? updatedCategory : cat
      );
      setSalaryCategories(updatedCategories);
      localStorage.setItem('salaryCategories', JSON.stringify(updatedCategories));
      setEditingCategory(null);
      setEditingCategoryData(null);
    }
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryData(null);
  };

  const deleteSalaryCategory = (id: string) => {
    const updatedCategories = salaryCategories.filter(cat => cat.id !== id);
    setSalaryCategories(updatedCategories);
    localStorage.setItem('salaryCategories', JSON.stringify(updatedCategories));
  };

  const updateEditingCategoryField = (field: keyof SalaryCategory, value: string | number) => {
    if (editingCategoryData) {
      setEditingCategoryData({
        ...editingCategoryData,
        [field]: value
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Manage Categories</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Locations Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Locations</h3>
            
            {/* Add New Location */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Enter location name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
              />
              <button
                onClick={addLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Current Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{location.name}</span>
                  <button
                    onClick={() => deleteLocation(location.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Categories Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Salary Categories</h3>
            
            {/* Add New Salary Category */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-3">Add New Salary Category</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Senior Level"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                  <input
                    type="number"
                    value={newCategory.basicSalary}
                    onChange={(e) => setNewCategory({ ...newCategory, basicSalary: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incentive</label>
                  <input
                    type="number"
                    value={newCategory.incentive}
                    onChange={(e) => setNewCategory({ ...newCategory, incentive: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                  <input
                    type="number"
                    value={newCategory.hra}
                    onChange={(e) => setNewCategory({ ...newCategory, hra: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-blue-600">
                  Total: ₹{(newCategory.basicSalary + newCategory.incentive + newCategory.hra).toLocaleString()}
                </div>
                <button
                  onClick={addSalaryCategory}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
            </div>

            {/* Current Salary Categories */}
            <div className="space-y-4">
              <h4 className="font-semibold">Current Salary Categories</h4>
              {salaryCategories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    {editingCategory === category.id ? (
                      <input
                        type="text"
                        value={editingCategoryData?.name || ''}
                        onChange={(e) => updateEditingCategoryField('name', e.target.value)}
                        className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <h5 className="text-lg font-semibold">{category.name}</h5>
                    )}
                    <div className="flex gap-2">
                      {editingCategory === category.id ? (
                        <>
                          <button
                            onClick={saveEditCategory}
                            className="p-2 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditCategory}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditCategory(category)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSalaryCategory(category.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Basic:</span>
                      {editingCategory === category.id ? (
                        <input
                          type="number"
                          value={editingCategoryData?.basicSalary || 0}
                          onChange={(e) => updateEditingCategoryField('basicSalary', parseInt(e.target.value) || 0)}
                          className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="ml-2 font-semibold">₹{category.basicSalary.toLocaleString()}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Incentive:</span>
                      {editingCategory === category.id ? (
                        <input
                          type="number"
                          value={editingCategoryData?.incentive || 0}
                          onChange={(e) => updateEditingCategoryField('incentive', parseInt(e.target.value) || 0)}
                          className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="ml-2 font-semibold">₹{category.incentive.toLocaleString()}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">HRA:</span>
                      {editingCategory === category.id ? (
                        <input
                          type="number"
                          value={editingCategoryData?.hra || 0}
                          onChange={(e) => updateEditingCategoryField('hra', parseInt(e.target.value) || 0)}
                          className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="ml-2 font-semibold">₹{category.hra.toLocaleString()}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        ₹{editingCategory === category.id 
                          ? ((editingCategoryData?.basicSalary || 0) + (editingCategoryData?.incentive || 0) + (editingCategoryData?.hra || 0)).toLocaleString()
                          : category.total.toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesModal;