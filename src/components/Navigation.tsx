import React from 'react';
import { NavigationTab } from '../types';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  Archive 
} from 'lucide-react';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'Dashboard' as NavigationTab, label: 'Dashboard', icon: BarChart3 },
    { id: 'Staff Management' as NavigationTab, label: 'Staff Management', icon: Users },
    { id: 'Attendance' as NavigationTab, label: 'Attendance', icon: Calendar },
    { id: 'Salary Management' as NavigationTab, label: 'Salary Management', icon: DollarSign },
    { id: 'Part-Time Staff' as NavigationTab, label: 'Part-Time Staff', icon: Clock },
    { id: 'Old Staff Records' as NavigationTab, label: 'Old Staff Records', icon: Archive },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Staff Management System</h1>
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;