import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Check, CircleAlert } from 'lucide-react';
import { signInWithEmail, ensureUserProfile } from '../api/auth';
import { isAdmin } from '../api/admin';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const redirectMessage = searchParams.get('message');

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  const validateEmail = (value: string) => {
    if (!value.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string) => value.length >= 6;

  useEffect(() => {
    setFieldErrors({
      email: touched.email && !validateEmail(email) ? 'Please enter a valid email address' : '',
      password:
        touched.password && !validatePassword(password)
          ? 'Password must be at least 6 characters'
          : '',
    });
  }, [email, password, touched]);

  const isFormValid = () => validateEmail(email) && validatePassword(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError(null);

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
      await ensureUserProfile(session.user.id, session.user.email);
      const userIsAdmin = await isAdmin();
      navigate(userIsAdmin ? '/admin' : '/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-block text-sm text-secondary hover:text-text">
          Back to Home
        </Link>

        <div className="admin-card p-8">
          <h1 className="mb-2 text-center text-2xl font-bold">Log In</h1>
          <p className="mb-6 text-center text-sm text-secondary">
            Enter your credentials to continue
          </p>

          {redirectMessage && <div className="banner banner-info mb-4 text-sm">{redirectMessage}</div>}
          {error && <div className="banner banner-error mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <label htmlFor="email" className="block text-sm font-medium text-text">
                  Email <span className="text-danger">*</span>
                </label>
                {touched.email && validateEmail(email) && <Check className="h-4 w-4 text-success" />}
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                placeholder="your@email.com"
                className={`input-base px-3 transition ${
                  touched.email ? (validateEmail(email) ? 'field-valid' : 'field-invalid') : ''
                }`}
              />
              {fieldErrors.email && (
                <p className="feedback-error">
                  <CircleAlert className="h-4 w-4" /> {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <label htmlFor="password" className="block text-sm font-medium text-text">
                  Password <span className="text-danger">*</span>
                </label>
                {touched.password && validatePassword(password) && (
                  <Check className="h-4 w-4 text-success" />
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                placeholder="••••••••"
                className={`input-base px-3 transition ${
                  touched.password
                    ? validatePassword(password)
                      ? 'field-valid'
                      : 'field-invalid'
                    : ''
                }`}
              />
              {fieldErrors.password && (
                <p className="feedback-error">
                  <CircleAlert className="h-4 w-4" /> {fieldErrors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-secondary">Minimum 6 characters required</p>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="btn-neutral w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-text hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
