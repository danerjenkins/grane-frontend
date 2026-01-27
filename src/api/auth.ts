/**
 * Authentication API - Supabase Auth
 *
 * IDENTITY STANDARD:
 * ==================
 * - auth.users: Supabase Auth table with authentication records
 * - public.users: Profile table where id = auth.uid() for authenticated users
 * - user_roles: Admin roles table (source of truth for admin status)
 *
 * PROFILE SYNCHRONIZATION:
 * ========================
 * When a user authenticates, ensureUserProfile() automatically:
 * 1. Checks if public.users row exists for auth.uid()
 * 2. If not, creates a new profile row with id = auth.uid()
 * 3. If already exists, does nothing (idempotent)
 *
 * This is called:
 * - After signInWithEmail() in Login.tsx
 * - On app initialization in App.tsx useEffect
 *
 * GUEST USERS:
 * ============
 * Users who place orders without authenticating get a public.users profile
 * with a generated UUID. They do NOT have auth accounts.
 * These profiles exist only in public.users and are not synced to auth.
 *
 * IMPLICATIONS:
 * =============
 * - Logging in never shows "no user found" for real auth users (profile is auto-created)
 * - Profiles are consistently keyed to auth.uid() for authenticated users
 * - Admin status is always checked via user_roles table + RPC, never auth.users fields
 */

import { supabase } from './supabaseClient';

export interface AuthSession {
  user: {
    id: string;
    email?: string;
  };
  access_token: string;
  refresh_token?: string;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(error?.message || 'Failed to sign in');
  }

  return {
    user: data.session.user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    return null;
  }

  return {
    user: data.session.user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}
/**
 * Ensures a profile row exists in public.users for the authenticated user.
 * If the user exists in auth but not in public.users, creates a profile.
 * This is called on login and app initialization to ensure consistency.
 */
export async function ensureUserProfile(userId: string, userEmail?: string): Promise<void> {
  try {
    // Check if user profile exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // If profile exists, we're done
    if (existingUser) {
      return;
    }

    // If error is "not found" (PGRST116), proceed to create profile
    if (selectError && selectError.code === 'PGRST116') {
      // Create profile row with id = auth.uid()
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email: userEmail || null,
        name: null,
        phone: null,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        // If insert fails with duplicate, profile might have been created by another process
        if (insertError.code === '23505') {
          // 23505 = unique constraint violation
          console.log(`Profile already exists for user ${userId}`);
          return;
        }
        throw insertError;
      }

      console.log(`Created profile for user ${userId}`);
      return;
    }

    // If there's another error, log it but don't block the user
    if (selectError) {
      console.error(`Error ensuring user profile for ${userId}:`, selectError);
      return;
    }
  } catch (err) {
    // Non-blocking error - log it but don't throw
    console.error('Failed to ensure user profile:', err);
  }
}