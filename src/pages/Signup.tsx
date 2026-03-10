import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, CircleAlert } from 'lucide-react';
import { signUp } from '../api/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    phone: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    phone: '',
  });

  const validateEmail = (value: string) => {
    if (!value.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string) => value.length >= 6;

  const validatePhone = (value: string) => {
    if (!value.trim()) return true;
    return value.replace(/\D/g, '').length >= 7;
  };

  useEffect(() => {
    setFieldErrors({
      email: touched.email && !validateEmail(email) ? 'Please enter a valid email address' : '',
      password:
        touched.password && !validatePassword(password)
          ? 'Password must be at least 6 characters'
          : '',
      phone:
        touched.phone && phone.trim() && !validatePhone(phone)
          ? 'Phone must have at least 7 digits'
          : '',
    });
  }, [email, password, phone, touched]);

  const isFormValid = () => validateEmail(email) && validatePassword(password) && validatePhone(phone);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true, phone: true });
    setError(null);
    setNeedsConfirmation(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (phone.trim() && !validatePhone(phone)) {
      setError('Phone number must have at least 7 digits.');
      return;
    }

    setLoading(true);

    try {
      const session = await signUp(email, password, name || undefined, phone || undefined);

      if (!session) {
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }

      navigate('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
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
          {needsConfirmation ? (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
                  <svg
                    className="h-8 w-8 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold">Check Your Email</h1>
                <p className="mb-4 text-sm text-secondary">
                  We've sent a confirmation email to <strong>{email}</strong>
                </p>
                <p className="text-sm text-secondary">
                  Click the link in the email to verify your account and complete signup.
                </p>
              </div>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm font-medium text-text hover:underline">
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold">Create Account</h1>
              <p className="mb-6 text-center text-sm text-secondary">
                Sign up to save your information and track orders
              </p>

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

                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
                    Full Name <span className="text-xs text-secondary">(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-base px-3"
                  />
                  <p className="mt-1 text-xs text-secondary">
                    We'll use this for your order confirmations
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-text">
                      Phone <span className="text-xs text-secondary">(optional)</span>
                    </label>
                    {touched.phone && phone.trim() && validatePhone(phone) && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched({ ...touched, phone: true })}
                    placeholder="(123) 456-7890 or 123-456-7890"
                    className={`input-base px-3 transition ${
                      touched.phone && phone.trim()
                        ? validatePhone(phone)
                          ? 'field-valid'
                          : 'field-invalid'
                        : ''
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="feedback-error">
                      <CircleAlert className="h-4 w-4" /> {fieldErrors.phone}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-secondary">
                    We'll text you pickup details and updates (7+ digits required)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="btn-neutral w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-secondary">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-text hover:underline">
                    Log In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
