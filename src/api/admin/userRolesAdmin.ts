import { supabase } from '../supabaseClient';
import type { UserRole } from './types';

/**
 * User Roles CRUD operations
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
 * Updates both users.is_admin and upserts user_roles
 */
export async function grantAdminRole(userId: string): Promise<void> {
  // First, update the is_admin flag on the user
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_admin: true })
    .eq('id', userId);

  if (updateError) {
    const isRLSError =
      updateError.message?.toLowerCase().includes('row-level security') ||
      updateError.code === 'PGRST301' ||
      updateError.message?.toLowerCase().includes('permission denied') ||
      updateError.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to grant admin access.');
    }
    throw new Error(`Failed to grant admin role: ${updateError.message}`);
  }

  // Then, insert the admin role into user_roles (ignore if already exists)
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
    throw new Error(`Failed to insert admin role: ${insertError.message}`);
  }
}

/**
 * Revoke admin role from a user
 * Updates both users.is_admin and deletes from user_roles
 */
export async function revokeAdminRole(userId: string): Promise<void> {
  // First, update the is_admin flag on the user
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_admin: false })
    .eq('id', userId);

  if (updateError) {
    const isRLSError =
      updateError.message?.toLowerCase().includes('row-level security') ||
      updateError.code === 'PGRST301' ||
      updateError.message?.toLowerCase().includes('permission denied') ||
      updateError.code === '42501';

    if (isRLSError) {
      throw new Error('Access denied: You may not have admin permissions to revoke admin access.');
    }
    throw new Error(`Failed to revoke admin role: ${updateError.message}`);
  }

  // Then, delete the admin role from user_roles
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
