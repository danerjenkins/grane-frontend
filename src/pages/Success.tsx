import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import PickupInfoCard from '../components/PickupInfoCard';

interface ConfirmResponse {
  success: boolean;
  orderId: string | null;
  status: string;
  paymentStatus: string;
  bakeDayDate: string | null;
  pickupInstructions: string;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [confirmResponse, setConfirmResponse] = useState<ConfirmResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID missing.');
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/checkout/confirm/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load payment status');
        return res.json();
      })
      .then((data: ConfirmResponse) => {
        setConfirmResponse(data);
        clearCart();
      })
      .catch((err) => {
        console.error('Error loading payment status:', err);
        setError('Failed to load your payment status. Please contact support.');
      })
      .finally(() => setLoading(false));
  }, [clearCart, sessionId]);

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-muted px-6 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-secondary">Session ID missing.</p>
          <Link to="/" className="mt-4 inline-block text-info hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      {loading ? (
        <div className="mx-auto max-w-xl text-center">
          <p className="text-secondary">Loading your order status...</p>
        </div>
      ) : error ? (
        <div className="banner banner-error mx-auto max-w-xl p-6 text-center">
          <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
          <p className="text-text">{error}</p>
          <p className="mt-4 text-sm text-secondary">
            Please contact us at (702) 767-3350 or check your email for more information.
          </p>
          <Link to="/" className="btn-neutral mt-6 inline-block px-6">
            Return Home
          </Link>
        </div>
      ) : confirmResponse ? (
        <div className="mx-auto max-w-xl">
          <div className="banner banner-success mb-8 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12" />
            <h1 className="mb-2 text-3xl font-bold">
              {confirmResponse.status === 'confirmed' ? 'Order Confirmed!' : 'Payment Received'}
            </h1>
            <p className="mb-3 text-text">
              Your order will be ready for home pickup on your selected bake day.
            </p>
            {confirmResponse.orderId && (
              <p className="text-sm text-secondary">
                Order ID:{' '}
                <span className="font-semibold">{confirmResponse.orderId.slice(0, 8)}</span>
              </p>
            )}
          </div>

          <div className="mb-6">
            <PickupInfoCard bakeDayDate={confirmResponse.bakeDayDate} variant="success" />
          </div>

          <div className="admin-card mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">Order Status</h2>
            <p className="mb-3 text-text">
              <span className="font-semibold">Payment status:</span> {confirmResponse.paymentStatus}
            </p>
            <p className="text-secondary">{confirmResponse.pickupInstructions}</p>
          </div>

          <div className="mb-6 rounded-lg border border-brand-soft bg-brand-soft p-6">
            <h3 className="mb-3 font-semibold text-brand-strong">What's Next?</h3>
            <ul className="space-y-2 text-sm text-brand-strong">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Watch for your confirmation and pickup emails.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Show up during the pickup window in Provo (near Center & University).</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Enjoy your fresh, artisanal sourdough!</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/about#faq" className="btn-secondary py-3 text-center">
              Questions? Check our FAQ
            </Link>
            <Link to="/" className="btn-neutral py-3 text-center">
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-xl text-center">
          <p className="text-secondary">Order not found.</p>
          <Link to="/" className="mt-4 inline-block text-info hover:underline">
            Return Home
          </Link>
        </div>
      )}
    </main>
  );
}
