import { supabase } from './supabaseClient';

/**
 * Check if the current user is an admin
 * Uses RPC function is_admin() which queries user_roles table
 * This is the ONLY source of truth for admin verification
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Call the SECURITY DEFINER function is_admin() which checks user_roles
    const { data, error } = await supabase.rpc('is_admin');

    if (error) {
      console.error('Failed to check admin status:', error);
      return false; // Default to non-admin on error for safety
    }

    return data === true;
  } catch (err) {
    console.error('Exception checking admin status:', err);
    return false; // Default to non-admin on error for safety
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Not authorized');
  }
}
