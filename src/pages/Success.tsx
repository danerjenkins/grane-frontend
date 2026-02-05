import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getOrderBySessionId, type Order } from '../api/orders';
import { useCart } from '../context/CartContext';

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

  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (!session_id) {
      setError('Session ID missing.');
      setLoading(false);
      return;
    }

    // First, confirm payment status with backend
    fetch(`${import.meta.env.VITE_API_URL}/checkout/confirm/${session_id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to confirm payment');
        return res.json();
      })
      .then((data: ConfirmResponse) => {
        console.log('Payment confirmed:', data);
        setConfirmResponse(data);
        // Clear the cart after successful payment confirmation
        clearCart();
      })
      .catch((err) => {
        console.error('Error confirming payment:', err);
        setError('Failed to confirm your payment. Please contact support.');
      })
      .finally(() => {
        // Then fetch order details from Supabase via frontend API
        getOrderBySessionId(session_id)
          .then((data) => setOrder(data))
          .catch((err) => {
            console.error('Error loading order:', err);
            if (!error) setError('Failed to load order details.');
          })
          .finally(() => setLoading(false));
      });
  }, [session_id]);

  if (!session_id) {
    return (
      <main className="min-h-screen bg-muted px-6 py-10">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-secondary">Session ID missing.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      {loading ? (
        <div className="max-w-xl mx-auto text-center">
          <p className="text-secondary">Confirming your order...</p>
        </div>
      ) : error ? (
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
          <p className="text-text">{error}</p>
          <p className="text-sm text-secondary mt-4">
            Please contact us at (702) 767-3350 or check your email for more information.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Return Home
          </Link>
        </div>
      ) : confirmResponse && order ? (
        <div className="max-w-xl mx-auto">
          {/* Confirmation Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
            <div className="text-5xl mb-3">✓</div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">Order Confirmed!</h1>
            <p className="text-text mb-3">
              Thank you for your order. We'll send you the pickup address and time via text or email
              shortly.
            </p>
            <p className="text-sm text-secondary">
              Order ID: <span className="font-semibold">{order.id.slice(0, 8)}</span>
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-surface shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {order.user?.name && (
              <p className="text-text mb-3">
                <span className="font-semibold">Name:</span> {order.user.name}
              </p>
            )}

            {order.bake_days?.[0]?.date && (
              <p className="text-text mb-3">
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

            <h3 className="font-semibold mb-3">Items</h3>
            <div className="space-y-3 mb-4">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{item.quantity}×</span>
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
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <p className="font-semibold text-text mb-1">Order Note:</p>
                <p className="text-secondary">{order.customer_note}</p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-brand-soft border border-brand-soft rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-brand-strong mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-brand-strong">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>We'll send you pickup details via text/email before bake day.</span>
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

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Link
              to="/about#faq"
              className="bg-gray-100 text-text py-3 text-center rounded-lg hover:bg-muted transition font-medium"
            >
              Questions? Check our FAQ
            </Link>
            <Link
              to="/"
              className="bg-black text-white py-3 text-center rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto text-center">
          <p className="text-secondary">Order not found.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      )}
    </main>
  );
}
