import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail, ensureUserProfile } from '../api/auth';
import { isAdmin } from '../api/admin';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which fields have been touched
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Real-time validation for touched fields
  useEffect(() => {
    const newErrors = {
      email: touched.email && !validateEmail(email) ? 'Please enter a valid email address' : '',
      password:
        touched.password && !validatePassword(password)
          ? 'Password must be at least 6 characters'
          : '',
    };
    setFieldErrors(newErrors);
  }, [email, password, touched]);

  const isFormValid = () => {
    return validateEmail(email) && validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Clear previous errors
    setError(null);

    // Validate fields
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const session = await signInWithEmail(email, password);
      // Ensure user profile exists in public.users
      await ensureUserProfile(session.user.id, session.user.email);

      // Check if user is admin - if so, redirect to admin dashboard
      const userIsAdmin = await isAdmin();
      navigate(userIsAdmin ? '/admin' : '/account');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-800 mb-6 inline-block">
          ← Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Log In</h1>
          <p className="text-gray-600 text-sm text-center mb-6">
            Enter your credentials to continue
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                {touched.email && validateEmail(email) && (
                  <span className="text-green-600 text-lg" title="Valid">
                    ✓
                  </span>
                )}
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                placeholder="your@email.com"
                className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition ${
                  touched.email
                    ? validateEmail(email)
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : ''
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <span>✕</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                {touched.password && validatePassword(password) && (
                  <span className="text-green-600 text-lg" title="Valid">
                    ✓
                  </span>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition ${
                  touched.password
                    ? validatePassword(password)
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : ''
                }`}
              />
              {fieldErrors.password && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <span>✕</span> {fieldErrors.password}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full bg-neutral-900 text-white py-2 rounded-lg font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-neutral-900 font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
