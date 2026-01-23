import { supabase } from './supabaseClient';

export async function isAdmin(): Promise<boolean> {
  try {
    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    // Check if user has admin role in user_roles table
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return !!data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check admin status';
    throw new Error(message);
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Not authorized');
  }
}
