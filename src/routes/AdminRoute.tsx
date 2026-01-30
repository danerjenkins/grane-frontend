import { useEffect, useState, type JSX } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { isAdmin } from '../api/admin';
import { signOut } from '../api/auth';

type AuthState = 'checking' | 'authorized' | 'not-logged-in' | 'unauthorized';

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setState('not-logged-in');
          return;
        }

        // Check if user is admin
        const admin = await isAdmin();
        if (admin) {
          setState('authorized');
        } else {
          setState('unauthorized');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setState('not-logged-in');
      }
    };

    checkAuth();
  }, []);

  if (state === 'checking') {
    return (
      <main className="min-h-screen bg-muted flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <p className="text-secondary">Checking permissions...</p>
        </div>
      </main>
    );
  }

  if (state === 'not-logged-in') {
    return <Navigate to="/login" replace />;
  }

  if (state === 'unauthorized') {
    return (
      <main className="min-h-screen bg-muted flex items-center justify-center px-4 py-10">
        <div className="max-w-md bg-white rounded-lg shadow-sm border p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Not Authorized</h1>
          <p className="text-text mb-6">You do not have permission to access this page.</p>

          <div className="space-y-3">
            <Link
              to="/"
              className="block bg-text text-white px-4 py-2 rounded-lg hover:bg-secondary transition"
            >
              Return Home
            </Link>
            <button
              onClick={async () => {
                try {
                  await signOut();
                  window.location.href = '/';
                } catch (err) {
                  console.error('Sign out failed:', err);
                }
              }}
              className="w-full bg-muted text-text px-4 py-2 rounded-lg hover:bg-muted transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
