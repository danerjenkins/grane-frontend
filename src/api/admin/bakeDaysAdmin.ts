import { supabase } from '../supabaseClient';
import type { BakeDay } from './types';

/**
 * Bake Days CRUD operations
 */

export async function listBakeDays(): Promise<BakeDay[]> {
  const { data, error } = await supabase
    .from('bake_days')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions for bake days. Please check your account permissions.'
      );
    }
    throw new Error(`Failed to list bake days: ${error.message}`);
  }

  return data || [];
}

export async function getBakeDayById(id: string): Promise<BakeDay> {
  const { data, error } = await supabase.from('bake_days').select('*').eq('id', id).single();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions for this bake day.');
    }
    throw new Error(`Failed to get bake day: ${error.message}`);
  }

  if (!data) {
    throw new Error('Bake day not found');
  }

  return data;
}

export async function createBakeDay(payload: Omit<BakeDay, 'id'>): Promise<BakeDay> {
  const { data, error } = await supabase.from('bake_days').insert([payload]).select().single();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to create bake days.');
    }
    throw new Error(`Failed to create bake day: ${error.message}`);
  }

  if (!data) {
    throw new Error('Bake day creation returned no data');
  }

  return data;
}

export async function updateBakeDay(
  id: string,
  patch: Partial<Omit<BakeDay, 'id'>>
): Promise<BakeDay> {
  const { data, error } = await supabase
    .from('bake_days')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to update bake days.');
    }
    throw new Error(`Failed to update bake day: ${error.message}`);
  }

  if (!data) {
    throw new Error('Bake day update returned no data');
  }

  return data;
}

export async function removeBakeDay(id: string): Promise<void> {
  const { error } = await supabase.from('bake_days').delete().eq('id', id);

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to delete bake days.');
    }
    throw new Error(`Failed to delete bake day: ${error.message}`);
  }
}

export default {
  listBakeDays,
  getBakeDayById,
  createBakeDay,
  updateBakeDay,
  removeBakeDay,
};
