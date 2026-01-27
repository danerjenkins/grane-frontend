import { supabase } from '../supabaseClient';
import type { UserRow } from './types';

/**
 * Users CRUD operations
 */

export async function listUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return data || [];
}

export async function getUserById(id: string): Promise<UserRow> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  if (!data) {
    throw new Error('User not found');
  }

  return data;
}

export async function createUser(
  payload: Omit<UserRow, 'id' | 'created_at'>
): Promise<UserRow> {
  const { data, error } = await supabase
    .from('users')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  if (!data) {
    throw new Error('User creation returned no data');
  }

  return data;
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<UserRow, 'id' | 'created_at'>>
): Promise<UserRow> {
  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  if (!data) {
    throw new Error('User update returned no data');
  }

  return data;
}

export async function removeUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  removeUser,
};
