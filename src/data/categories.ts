import { Category, SalaryCategory } from '../types';

// Default location categories
export const defaultLocationCategories: Category[] = [
  {
    id: 'loc-1',
    name: 'Big Shop',
    type: 'location',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'loc-2',
    name: 'Small Shop',
    type: 'location',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'loc-3',
    name: 'Godown',
    type: 'location',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Default salary categories
export const defaultSalaryCategories: SalaryCategory[] = [
  {
    id: 'sal-1',
    name: 'Entry Level',
    basicSalary: 15000,
    incentive: 8000,
    hra: 0,
    totalSalary: 23000,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sal-2',
    name: 'Experienced',
    basicSalary: 15000,
    incentive: 10000,
    hra: 5000,
    totalSalary: 30000,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sal-3',
    name: 'Senior',
    basicSalary: 18000,
    incentive: 12000,
    hra: 5000,
    totalSalary: 35000,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];