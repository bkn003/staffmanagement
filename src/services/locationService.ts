import { supabase } from '../lib/supabase';

export interface Location {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const locationService = {
  async getAll(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return data || [];
  },

  async create(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Location>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
};
