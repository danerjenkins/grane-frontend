import { supabase } from '../supabaseClient';
import type { UserRole } from './types';

/**
 * User Roles CRUD operations
 * NOTE: user_roles table is the ONLY source of truth for admin verification
 * The is_admin() RPC function queries this table to determine admin status
 */

export async function listUserRoles(): Promise<UserRole[]> {
  const { data, error } = await supabase.from('user_roles').select('*');

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to view user roles.');
    }
    throw new Error(`Failed to list user roles: ${error.message}`);
  }

  return data || [];
}

export async function getUserRolesByUserId(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase.from('user_roles').select('*').eq('user_id', userId);

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to view user roles.');
    }
    throw new Error(`Failed to get user roles: ${error.message}`);
  }

  return data || [];
}

/**
 * Grant admin role to a user
 * ONLY modifies user_roles table - this is the source of truth for admin status
 */
export async function grantAdminRole(userId: string): Promise<void> {
  // Insert the admin role into user_roles (ignore if already exists)
  const { error: insertError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'admin',
  });

  // If it already exists, that's fine - we just wanted to ensure it exists
  if (insertError && !insertError.message?.toLowerCase().includes('duplicate')) {
    const isRLSError =
      insertError.message?.toLowerCase().includes('row-level security') ||
      insertError.code === 'PGRST301' ||
      insertError.message?.toLowerCase().includes('permission denied') ||
      insertError.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have permissions to modify user roles.');
    }
    throw new Error(`Failed to grant admin role: ${insertError.message}`);
  }
}

/**
 * Revoke admin role from a user
 * ONLY deletes from user_roles table - this is the source of truth for admin status
 */
export async function revokeAdminRole(userId: string): Promise<void> {
  // Delete the admin role from user_roles
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (deleteError) {
    const isRLSError =
      deleteError.message?.toLowerCase().includes('row-level security') ||
      deleteError.code === 'PGRST301' ||
      deleteError.message?.toLowerCase().includes('permission denied') ||
      deleteError.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have permissions to modify user roles.');
    }
    throw new Error(`Failed to delete admin role: ${deleteError.message}`);
  }
}

export default {
  listUserRoles,
  getUserRolesByUserId,
  grantAdminRole,
  revokeAdminRole,
};
