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
    return phone.trim().length > 0;
  };

  const validateContact = () => {
    return customerEmail.trim().length > 0 && customerPhone.trim().length > 0;
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      cart.length > 0 &&
      selectedBakeDay &&
      validateName(customerName) &&
      validateEmail(customerEmail) &&
      validateContact()
    );
  };

  const handleCheckout = async () => {
    // Clear previous errors
    setErrors({ name: '', email: '', phone: '' });

    // Validate
    const newErrors = {
      name: !validateName(customerName) ? 'Name is required' : '',
      email: !validateEmail(customerEmail) ? 'Email is required and must be valid' : '',
      phone: !validatePhone(customerPhone) ? 'Phone is required' : '',
    };

    setErrors(newErrors);

    // If any errors, don't submit
    if (newErrors.name || newErrors.email || newErrors.phone) {
      return;
    }

    if (!selectedBakeDay) {
      alert('Please choose a bake day.');
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

      if (data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        console.error('Checkout Error', data);
        alert('Checkout failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Checkout Error', error);
      alert('Checkout failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

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
          <label className="block font-semibold mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            className={`border rounded p-2 w-full ${errors.name ? 'border-red-500' : ''} ${isLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            type="text"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="Enter your name"
            disabled={isLoggedIn}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block font-semibold mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            className={`border rounded p-2 w-full ${errors.email ? 'border-red-500' : ''} ${isLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            type="email"
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="your@email.com"
            disabled={isLoggedIn}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block font-semibold mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            className={`border rounded p-2 w-full ${errors.phone ? 'border-red-500' : ''} ${isLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            type="tel"
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
            placeholder="(123) 456-7890"
            disabled={isLoggedIn}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          <p className="text-xs text-gray-500 mt-1">
            We'll text or email you the pickup address after payment
          </p>
        </div>

        {/* Order Note (Optional) */}
        <div>
          <label className="block font-semibold mb-1">Order note (optional)</label>
          <textarea
            className="border rounded p-2 w-full"
            rows={3}
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Any special requests or notes about your order..."
          />
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
                  <p className="text-sm text-gray-600">${(item.price / 100).toFixed(2)} each</p>
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
                    ${((item.price * item.quantity) / 100).toFixed(2)}
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
        <p className="text-xl font-bold">Total: ${(total / 100).toFixed(2)}</p>

        <button
          onClick={handleCheckout}
          disabled={!isFormValid() || isSubmitting}
          className={`px-6 py-3 rounded font-semibold transition ${
            !isFormValid() || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isSubmitting ? 'Redirecting...' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
}
