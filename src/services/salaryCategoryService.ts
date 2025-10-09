import { supabase } from '../lib/supabase';

export interface SalaryCategory {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const salaryCategoryService = {
  async getAll(): Promise<SalaryCategory[]> {
    const { data, error } = await supabase
      .from('salary_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  async create(category: Omit<SalaryCategory, 'id' | 'created_at' | 'updated_at'>): Promise<SalaryCategory> {
    const { data, error } = await supabase
      .from('salary_categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<SalaryCategory>): Promise<SalaryCategory> {
    const { data, error } = await supabase
      .from('salary_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('salary_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
};
