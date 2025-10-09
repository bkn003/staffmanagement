import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { salaryCategoryService, SalaryCategory } from '../services/salaryCategoryService';

interface SalaryCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalaryCategoryManager: React.FC<SalaryCategoryManagerProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState<SalaryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', display_name: '' });
  const [editValues, setEditValues] = useState({ name: '', display_name: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await salaryCategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading salary categories:', error);
      alert('Failed to load salary categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.name.trim() || !newCategory.display_name.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const maxSortOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.sort_order))
        : 0;

      const created = await salaryCategoryService.create({
        name: newCategory.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: newCategory.display_name,
        is_active: true,
        sort_order: maxSortOrder + 1
      });
      setCategories([...categories, created]);
      setNewCategory({ name: '', display_name: '' });
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(error.message || 'Failed to add salary category');
    }
  };

  const handleEdit = (category: SalaryCategory) => {
    setEditingId(category.id);
    setEditValues({ name: category.name, display_name: category.display_name });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValues.display_name.trim()) {
      alert('Display name cannot be empty');
      return;
    }

    try {
      const updated = await salaryCategoryService.update(id, {
        display_name: editValues.display_name
      });
      setCategories(categories.map(cat => cat.id === id ? updated : cat));
      setEditingId(null);
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert(error.message || 'Failed to update salary category');
    }
  };

  const handleDelete = async (id: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete "${displayName}"?`)) return;

    try {
      await salaryCategoryService.delete(id);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.message || 'Failed to delete salary category');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <div className="flex items-center gap-2">
            <DollarSign className="text-green-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Manage Salary Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Categories ({categories.length})
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Category</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {showAddForm && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
                  <h4 className="font-semibold text-gray-700">Add New Salary Category</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Internal Name
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g., meal_allowance"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={newCategory.display_name}
                        onChange={(e) => setNewCategory({ ...newCategory, display_name: e.target.value })}
                        placeholder="e.g., Meal Allowance"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategory({ name: '', display_name: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {editingId === category.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editValues.display_name}
                          onChange={(e) => setEditValues({ ...editValues, display_name: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{category.display_name}</p>
                          <p className="text-sm text-gray-500">{category.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.display_name)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {categories.length === 0 && !showAddForm && (
                <div className="text-center py-8 text-gray-500">
                  No salary categories found. Add one to get started!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryCategoryManager;
