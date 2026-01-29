import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, type CartItem } from '../context/CartContext';
import { getSession, signOut } from '../api/auth';
import { getMyProfile } from '../api/profile';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, selectedBakeDay, updateQuantity, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Track which fields have been touched for validation
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Auto-fill user information if logged in
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const session = await getSession();
        if (session) {
          setIsLoggedIn(true);
          const profile = await getMyProfile();
          if (profile.name) setCustomerName(profile.name);
          if (profile.email) setCustomerEmail(profile.email);
          if (profile.phone) setCustomerPhone(profile.phone);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        // User not logged in or error loading profile - just continue with empty form
        console.log('No profile loaded:', err);
        setIsLoggedIn(false);
      }
    };

    loadUserProfile();
  }, []);

  const total = cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);

  const handleSignOut = async () => {
    try {
      await signOut();
      clearCart();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  // Validate fields
  const validateName = (name: string) => {
    return name.trim().length > 0;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return false; // required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return false; // required
    // Must have at least 7 digits
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length >= 7;
  };

  // Real-time validation for touched fields
  useEffect(() => {
    const newErrors = {
      name: touched.name && !validateName(customerName) ? 'Name is required' : '',
      email:
        touched.email && !validateEmail(customerEmail)
          ? 'Please enter a valid email address (example@domain.com)'
          : '',
      phone:
        touched.phone && !validatePhone(customerPhone) ? 'Phone must have at least 7 digits' : '',
    };
    setErrors(newErrors);
  }, [customerName, customerEmail, customerPhone, touched]);

  // Check if form is valid
  const isFormValid = () => {
    return (
      cart.length > 0 &&
      selectedBakeDay &&
      validateName(customerName) &&
      validateEmail(customerEmail) &&
      validatePhone(customerPhone)
    );
  };

  const handleCheckout = async () => {
    // Mark all fields as touched to show any validation errors
    setTouched({ name: true, email: true, phone: true });

    // Clear previous messages
    setGlobalError('');
    setSuccessMessage('');

    // Validate required fields
    if (!validateName(customerName)) {
      setGlobalError('Please enter your name.');
      return;
    }

    if (!validateEmail(customerEmail)) {
      setGlobalError('Please enter a valid email address.');
      return;
    }

    if (!validatePhone(customerPhone)) {
      setGlobalError('Please enter a valid phone number with at least 7 digits.');
      return;
    }

    if (!selectedBakeDay) {
      setGlobalError('Please choose a bake day.');
      return;
    }

    setIsSubmitting(true);

    try {
      const body = {
        bake_day_id: selectedBakeDay.id,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        customer_note: orderNote.trim() || undefined,
        items: cart.map((item: CartItem) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      // Prepare request headers
      const headers: HeadersInit = { 'Content-Type': 'application/json' };

      // Get current session and add auth header if logged in
      try {
        const session = await getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (err) {
        // No session or error getting session - continue without auth header (guest checkout)
        console.log('No active session, proceeding with guest checkout');
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific backend error messages
        const errorMessage = data.error || 'Checkout failed. Please try again.';
        setGlobalError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        setGlobalError('Checkout failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Checkout Error', error);
      setGlobalError('An error occurred. Please check your information and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Global Error Message */}
      {globalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">⚠️ {globalError}</p>
        </div>
      )}

      {/* Global Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">✓ {successMessage}</p>
        </div>
      )}

      {/* Customer Information */}
      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Information</h2>
          {isLoggedIn && (
            <button
              onClick={handleSignOut}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              title="Sign out to use different information"
            >
              Not you? Sign out
            </button>
          )}
        </div>

        {/* Name */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block font-semibold">
              Name <span className="text-red-500">*</span>
            </label>
            {touched.name && validateName(customerName) && (
              <span className="text-green-600 text-lg" title="Valid">
                ✓
              </span>
            )}
          </div>
          <input
            className={`border rounded p-3 w-full transition ${
              touched.name
                ? validateName(customerName)
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300'
            } ${isLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onBlur={() => setTouched({ ...touched, name: true })}
            placeholder="Enter your full name"
            disabled={isLoggedIn}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <span>✕</span> {errors.name}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">We'll use this for your order confirmation</p>
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block font-semibold">
              Email <span className="text-red-500">*</span>
            </label>
            {touched.email && validateEmail(customerEmail) && (
              <span className="text-green-600 text-lg" title="Valid">
                ✓
              </span>
            )}
          </div>
          <input
            className={`border rounded p-3 w-full transition ${
              touched.email
                ? validateEmail(customerEmail)
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300'
            } ${isLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            onBlur={() => setTouched({ ...touched, email: true })}
            placeholder="example@domain.com"
            disabled={isLoggedIn}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <span>✕</span> {errors.email}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">We'll send your pickup details to this email</p>
        </div>

        {/* Phone */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block font-semibold">
              Phone <span className="text-red-500">*</span>
            </label>
            {touched.phone && validatePhone(customerPhone) && (
              <span className="text-green-600 text-lg" title="Valid">
                ✓
              </span>
            )}
          </div>
          <input
            className={`border rounded p-3 w-full transition ${
              touched.phone
                ? validatePhone(customerPhone)
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300'
            } ${isLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            onBlur={() => setTouched({ ...touched, phone: true })}
            placeholder="(123) 456-7890 or 123-456-7890"
            disabled={isLoggedIn}
          />
          {errors.phone && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <span>✕</span> {errors.phone}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            We'll text you the pickup address and any updates (must be 7+ digits)
          </p>
        </div>

        {/* Order Note (Optional) */}
        <div>
          <label className="block font-semibold mb-1">Order note (optional)</label>
          <textarea
            className="border border-gray-300 rounded p-3 w-full"
            rows={3}
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Any special requests or notes about your order..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tell us about allergies, preferences, or special instructions
          </p>
        </div>
      </div>
      {/* Cart Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Your Items</h2>
          {cart.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your entire cart?')) {
                  clearCart();
                }
              }}
              className="text-sm text-red-600 hover:text-red-800 hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item: CartItem) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center border-b pb-3"
              >
                {/* Left side: item name + price */}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                </div>

                {/* Right side: quantity controls + total */}
                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center border rounded px-2 py-1">
                    <button
                      className="px-2 font-bold text-lg"
                      onClick={() => {
                        if (item.quantity === 1) {
                          removeFromCart(item.product_id);
                        } else {
                          updateQuantity(item.product_id, item.quantity - 1);
                        }
                      }}
                    >
                      –
                    </button>

                    <span className="px-3">{item.quantity}</span>

                    <button
                      className="px-2 font-bold text-lg"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Item total */}
                  <p className="font-medium w-16 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bake Day Info */}
      <div className="mb-8 bg-amber-50 p-4 rounded-lg">
        <p className="font-semibold mb-2">
          Bake Day:{' '}
          {selectedBakeDay ? new Date(selectedBakeDay.date).toLocaleDateString() : 'None selected'}
        </p>
        <div className="text-sm text-gray-700 space-y-1">
          <p>📍 Pickup in Provo (near Center & University)</p>
          <p>🕕 Pickup window: 6pm - 9pm on bake day</p>
          <p className="text-xs text-gray-600 mt-2">
            Exact address will be sent after payment. Questions? Text (702) 767-3350
          </p>
        </div>
      </div>

      {/* Total + Checkout Button */}
      <div className="flex justify-between items-center">
        <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>

        <button
          onClick={handleCheckout}
          disabled={!isFormValid() || isSubmitting}
          className={`px-6 py-3 rounded font-semibold transition ${
            !isFormValid() || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
}
