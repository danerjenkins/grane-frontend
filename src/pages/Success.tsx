import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { getOrderBySessionId, type Order } from '../api/orders';
import { useCart } from '../context/CartContext';
import PickupInfoCard from '../components/PickupInfoCard';

interface ConfirmResponse {
  success: boolean;
  orderId: string;
  status: string;
  paymentStatus: string;
  pickupInstructions: string;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
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
        if (!res.ok) throw new Error('Failed to confirm payment');
        return res.json();
      })
      .then((data: ConfirmResponse) => {
        setConfirmResponse(data);
        clearCart();
      })
      .catch((err) => {
        console.error('Error confirming payment:', err);
        setError('Failed to confirm your payment. Please contact support.');
      })
      .finally(() => {
        getOrderBySessionId(sessionId)
          .then((data) => setOrder(data))
          .catch((err) => {
            console.error('Error loading order:', err);
            setError((current) => current ?? 'Failed to load order details.');
          })
          .finally(() => setLoading(false));
      });
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
          <p className="text-secondary">Confirming your order...</p>
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
      ) : confirmResponse && order ? (
        <div className="mx-auto max-w-xl">
          <div className="banner banner-success mb-8 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12" />
            <h1 className="mb-2 text-3xl font-bold">Order Confirmed!</h1>
            <p className="mb-3 text-text">
              Your order will be ready for home pickup on your selected bake day.
            </p>
            <p className="text-sm text-secondary">
              Order ID: <span className="font-semibold">{order.id.slice(0, 8)}</span>
            </p>
          </div>

          <div className="mb-6">
            <PickupInfoCard bakeDayDate={order.bake_days?.[0]?.date ?? null} variant="success" />
          </div>

          <div className="admin-card mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>

            {order.user?.name && (
              <p className="mb-3 text-text">
                <span className="font-semibold">Name:</span> {order.user.name}
              </p>
            )}

            {order.bake_days?.[0]?.date && (
              <p className="mb-3 text-text">
                <span className="font-semibold">Bake Day:</span>{' '}
                {new Date(order.bake_days[0].date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}

            <hr className="my-4" />

            <h3 className="mb-3 font-semibold">Items</h3>
            <div className="mb-4 space-y-3">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="flex-1">{item.product?.name}</span>
                  <span className="text-secondary">
                    ${((item.item_price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="text-lg">
                <span className="font-semibold">Total:</span> ${(order.total_price ?? 0).toFixed(2)}
              </p>
            </div>

            {order.customer_note && (
              <div className="mt-4 rounded bg-muted p-3 text-sm">
                <p className="mb-1 font-semibold text-text">Order Note:</p>
                <p className="text-secondary">{order.customer_note}</p>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-lg border border-brand-soft bg-brand-soft p-6">
            <h3 className="mb-3 font-semibold text-brand-strong">What's Next?</h3>
            <ul className="space-y-2 text-sm text-brand-strong">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Your pickup details are listed above.</span>
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
