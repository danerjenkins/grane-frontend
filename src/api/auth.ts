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
