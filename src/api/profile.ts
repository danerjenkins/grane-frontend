/**
 * Customer Profile API
 *
 * Safe API layer for authenticated users to manage their own profile.
 * Uses Supabase RLS: users can only access their own public.users row (id = auth.uid()).
 *
 * This is separate from admin/usersAdmin.ts which is for admin operations.
 */

import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

/**
 * Get the current authenticated user's profile.
 * Fetches from public.users where id = auth.uid().
 * If profile doesn't exist, creates it automatically.
 * Throws error if not authenticated.
 */
export async function getMyProfile(): Promise<UserProfile> {
  // Get current authenticated user
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error('Not authenticated');
  }

  // Fetch user's profile from public.users
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  // Profile exists - return it
  if (data) {
    return data;
  }

  // Profile not found - create it
  if (error && error.code === 'PGRST116') {
    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email || null,
        name: null,
        phone: null,
      })
      .select()
      .single();

    if (insertError) {
      // Handle duplicate key (race condition)
      if (insertError.code === '23505') {
        // Try fetching again
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (retryError || !retryData) {
          throw new Error('Failed to load profile after creation');
        }
        return retryData;
      }
      throw new Error(`Failed to create profile: ${insertError.message}`);
    }

    if (!newProfile) {
      throw new Error('Failed to create profile: no data returned');
    }

    return newProfile;
  }

  // Other error
  throw new Error(`Failed to load profile: ${error?.message || 'Unknown error'}`);
}

/**
 * Update the current authenticated user's profile.
 * Updates public.users where id = auth.uid().
 * Only name and phone can be updated (email is read-only from auth).
 */
export async function updateMyProfile(patch: {
  name?: string | null;
  phone?: string | null;
}): Promise<UserProfile> {
  // Get current authenticated user
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error('Not authenticated');
  }

  // Update profile
  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', authData.user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update profile: no data returned');
  }

  return data;
}

export default {
  getMyProfile,
  updateMyProfile,
};
