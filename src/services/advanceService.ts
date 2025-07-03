import { supabase } from '../lib/supabase';
import { AdvanceDeduction } from '../types';
import type { DatabaseAdvance } from '../lib/supabase';

export const advanceService = {
  async getAll(): Promise<AdvanceDeduction[]> {
    const { data, error } = await supabase
      .from('advances')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching advances:', error);
      throw error;
    }

    return data.map(this.mapFromDatabase);
  },

  async getByStaffAndMonth(staffId: string, month: number, year: number): Promise<AdvanceDeduction | null> {
    const { data, error } = await supabase
      .from('advances')
      .select('*')
      .eq('staff_id', staffId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      console.error('Error fetching advance:', error);
      throw error;
    }

    return this.mapFromDatabase(data);
  },

  async getPreviousMonthAdvance(staffId: string, currentMonth: number, currentYear: number): Promise<number> {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }

    const previousAdvance = await this.getByStaffAndMonth(staffId, prevMonth, prevYear);
    return previousAdvance?.newAdvance || 0;
  },

  async upsert(advance: Omit<AdvanceDeduction, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdvanceDeduction> {
    const dbAdvance = this.mapToDatabase(advance);
    
    const { data, error } = await supabase
      .from('advances')
      .upsert([dbAdvance], {
        onConflict: 'staff_id,month,year'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting advance:', error);
      throw error;
    }

    return this.mapFromDatabase(data);
  },

  mapFromDatabase(dbAdvance: DatabaseAdvance): AdvanceDeduction {
    return {
      id: dbAdvance.id,
      staffId: dbAdvance.staff_id,
      month: dbAdvance.month,
      year: dbAdvance.year,
      oldAdvance: dbAdvance.old_advance,
      currentAdvance: dbAdvance.current_advance,
      deduction: dbAdvance.deduction,
      newAdvance: dbAdvance.new_advance,
      notes: dbAdvance.notes,
      createdAt: dbAdvance.created_at,
      updatedAt: dbAdvance.updated_at
    };
  },

  mapToDatabase(advance: Omit<AdvanceDeduction, 'id' | 'createdAt' | 'updatedAt'>): Omit<DatabaseAdvance, 'id' | 'created_at' | 'updated_at'> {
    return {
      staff_id: advance.staffId,
      month: advance.month,
      year: advance.year,
      old_advance: advance.oldAdvance,
      current_advance: advance.currentAdvance,
      deduction: advance.deduction,
      new_advance: advance.newAdvance,
      notes: advance.notes
    };
  }
};