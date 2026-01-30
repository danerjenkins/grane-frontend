import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  // Track which fields have been touched
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    phone: false,
  });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    phone: '',
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

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true; // Optional field
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length >= 7;
  };

  // Real-time validation for touched fields
  useEffect(() => {
    const newErrors = {
      email: touched.email && !validateEmail(email) ? 'Please enter a valid email address' : '',
      password:
        touched.password && !validatePassword(password)
          ? 'Password must be at least 6 characters'
          : '',
      phone:
        touched.phone && phone.trim() && !validatePhone(phone)
          ? 'Phone must have at least 7 digits'
          : '',
    };
    setFieldErrors(newErrors);
  }, [email, password, phone, touched]);

  const isFormValid = () => {
    return validateEmail(email) && validatePassword(password) && validatePhone(phone);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark required fields as touched
    setTouched({ email: true, password: true, phone: true });

    // Clear previous messages
    setError(null);
    setNeedsConfirmation(false);

    // Validate required fields
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Validate optional phone if provided
    if (phone.trim() && !validatePhone(phone)) {
      setError('Phone number must have at least 7 digits.');
      return;
    }

    setLoading(true);

    try {
      const session = await signUp(email, password, name || undefined, phone || undefined);

      // If session is null, email confirmation is required
      if (!session) {
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }

      // Session exists - user is logged in, redirect to account
      navigate('/account');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link to="/" className="text-sm text-secondary hover:text-text mb-6 inline-block">
          ← Back to Home
        </Link>

        {/* Card */}
        <div className="bg-surface rounded-lg shadow-sm border p-8">
          {needsConfirmation ? (
            // Email Confirmation Required
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
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
                <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
                <p className="text-secondary text-sm mb-4">
                  We've sent a confirmation email to <strong>{email}</strong>
                </p>
                <p className="text-secondary text-sm">
                  Click the link in the email to verify your account and complete signup.
                </p>
              </div>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-text font-medium hover:underline text-sm">
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            // Signup Form
            <>
              <h1 className="text-2xl font-bold mb-2 text-center">Create Account</h1>
              <p className="text-secondary text-sm text-center mb-6">
                Sign up to save your information and track orders
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
                    <label htmlFor="email" className="block text-sm font-medium text-text">
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
                    className={`w-full px-3 py-2 border rounded-lg text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-neutral-900 transition ${
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
                    <label htmlFor="password" className="block text-sm font-medium text-text">
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
                    className={`w-full px-3 py-2 border rounded-lg text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-neutral-900 transition ${
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
                  <p className="text-xs text-secondary mt-1">Minimum 6 characters required</p>
                </div>

                {/* Name (Optional) */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
                    Full Name <span className="text-secondary text-xs">(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border rounded-lg text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-xs text-secondary mt-1">
                    We'll use this for your order confirmations
                  </p>
                </div>

                {/* Phone (Optional) */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="phone" className="block text-sm font-medium text-text">
                      Phone <span className="text-secondary text-xs">(optional)</span>
                    </label>
                    {touched.phone && phone.trim() && validatePhone(phone) && (
                      <span className="text-green-600 text-lg" title="Valid">
                        ✓
                      </span>
                    )}
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched({ ...touched, phone: true })}
                    placeholder="(123) 456-7890 or 123-456-7890"
                    className={`w-full px-3 py-2 border rounded-lg text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-neutral-900 transition ${
                      touched.phone && phone.trim()
                        ? validatePhone(phone)
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : ''
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <span>✕</span> {fieldErrors.phone}
                    </p>
                  )}
                  <p className="text-xs text-secondary mt-1">
                    We'll text you pickup details and updates (7+ digits required)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="w-full bg-neutral-900 text-white py-2 rounded-lg font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-secondary">
                  Already have an account?{' '}
                  <Link to="/login" className="text-text font-medium hover:underline">
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
