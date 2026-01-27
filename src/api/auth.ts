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

/**
 * Sign up a new user with email and password.
 * Optionally pass name and phone to pre-populate the profile.
 *
 * IMPORTANT:
 * - If email confirmations are enabled, data.session will be null
 * - User must verify email before they can sign in
 * - If confirmations are disabled, session is created immediately
 */
export async function signUp(
  email: string,
  password: string,
  name?: string,
  phone?: string
): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // If email confirmations are enabled, session will be null
  // User needs to verify email before they can sign in
  if (!data.session) {
    // User created but needs to confirm email
    // We can't create profile yet since we don't have a session
    return null;
  }

  // Session exists - email confirmations are disabled
  // Create profile row with name/phone if provided
  if (data.session.user.id) {
    await ensureUserProfile(data.session.user.id, email, name, phone);
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
 * Get the current authenticated user's session.
 * Throws an error if user is not authenticated.
 * Use this in components that require authentication.
 */
export async function getCurrentUser(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}

/**
 * Helper to ensure user is authenticated.
 * Use in route guards or components.
 * Returns true if user is logged in, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session !== null;
  } catch {
    return false;
  }
}

/**
 * Ensures a profile row exists in public.users for the authenticated user.
 * If the user exists in auth but not in public.users, creates a profile.
 * This is called on login and app initialization to ensure consistency.
 * Can optionally pre-populate name and phone fields.
 */
export async function ensureUserProfile(
  userId: string,
  userEmail?: string,
  userName?: string,
  userPhone?: string
): Promise<void> {
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
        name: userName || null,
        phone: userPhone || null,
      });

      // If insert fails with duplicate, profile might have been created by another process
      if (insertError) {
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
