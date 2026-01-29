import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from '../api/auth';
import { getMyProfile, updateMyProfile, type UserProfile } from '../api/profile';
import { getMyOrders, type MyOrderRow } from '../api/myOrders';
import { useCart } from '../context/CartContext';

export default function Account() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orders, setOrders] = useState<MyOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await getMyProfile();
        setUser(profile);
        setName(profile.name || '');
        setPhone(profile.phone || '');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Load orders after profile is available
  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const results = await getMyOrders();
        setOrders(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load orders';
        setOrdersError(message);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const updatedProfile = await updateMyProfile({
        name: name || null,
        phone: phone || null,
      });

      // Update local state with returned profile
      setUser(updatedProfile);

      setIsDirty(false);
      setSaveSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      clearCart();
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800 mb-6 inline-block">
            ← Back to Home
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-700 mb-2">Error</h1>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800 mb-6 inline-block">
            ← Back to Home
          </Link>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-yellow-700 mb-2">Not Found</h1>
            <p className="text-yellow-700">Your profile could not be found.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Back to Home
          </Link>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Account</h1>
          <p className="text-neutral-600">View and manage your account information</p>
        </div>

        {/* Error Banner */}
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">Profile updated successfully!</p>
          </div>
        )}

        {/* Account Card */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Account Information</h2>

            {/* Email (Read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600"
              />
              <p className="text-xs text-neutral-500 mt-1">
                This email is associated with your account
              </p>
            </div>

            {/* User ID (Read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Account ID</label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 font-mono text-sm"
              />
            </div>

            {/* Name (Editable) */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Phone (Editable) */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Account Created */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Account Created
              </label>
              <input
                type="text"
                value={new Date(user.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                disabled
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {isDirty && (
              <button
                onClick={() => {
                  setName(user.name || '');
                  setPhone(user.phone || '');
                  setIsDirty(false);
                }}
                className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* My Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">My Orders</h2>

          {ordersLoading && <p className="text-sm text-neutral-600">Loading your orders...</p>}

          {!ordersLoading && ordersError && <p className="text-sm text-red-700">{ordersError}</p>}

          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="text-sm text-neutral-600">You haven’t placed any orders yet.</p>
          )}

          {!ordersLoading && !ordersError && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-neutral-500 border-b">
                  <tr>
                    <th className="py-3 pr-4">Order Date</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => {
                    const totalPrice = order.price_with_tax ?? order.total_price ?? null;
                    const totalDisplay =
                      totalPrice === null ? '—' : `$${(totalPrice).toFixed(2)}`;
                    const statusDisplay = order.status || order.stripe_status || '—';

                    return (
                      <tr key={order.id}>
                        <td className="py-3 pr-4 text-neutral-900">
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 pr-4 text-neutral-700 capitalize">{statusDisplay}</td>
                        <td className="py-3 text-neutral-900 font-medium">{totalDisplay}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
