import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, type MyOrderRow } from '../api/myOrders';
import ProductImage from '../components/ProductImage';

const formatMoney = (value: number | null) => {
  if (value === null) return '-';
  return `$${value.toFixed(2)}`;
};

const formatOrderDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function MyOrders() {
  const [orders, setOrders] = useState<MyOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await getMyOrders();
        setOrders(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load orders';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const toggleOrder = (orderId: string) => {
    setExpandedOrderIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId]
    );
  };

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/account" className="text-sm text-secondary hover:text-text">
            Back to Account
          </Link>
          <Link to="/bake-days" className="text-sm font-medium text-text hover:text-secondary">
            Order more bake days
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text mb-2">My Orders</h1>
          <p className="text-secondary">
            Review your past orders, see totals, and check item details.
          </p>
        </div>

        {loading && (
          <div className="bg-surface border border-neutral-200 rounded-lg p-6">
            <p className="text-sm text-secondary">Loading your orders...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">We hit a snag</h2>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-surface border border-neutral-200 rounded-lg p-8 text-center">
            <p className="text-sm text-secondary mb-4">You haven't placed any orders yet.</p>
            <Link
              to="/bake-days"
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-text text-white text-sm font-medium hover:bg-secondary transition"
            >
              Browse bake days
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const total = order.price_with_tax ?? order.total_price ?? null;
              const status = order.status || order.stripe_status || 'pending';
              const isExpanded = expandedOrderIds.includes(order.id);
              const items = order.order_items ?? [];

              return (
                <div
                  key={order.id}
                  className="bg-surface border border-neutral-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-secondary">Order date</p>
                      <p className="text-lg font-semibold text-text">
                        {formatOrderDate(order.created_at)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-secondary">Status</p>
                      <p className="text-base font-medium text-text capitalize">{status}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-secondary">Total</p>
                      <p className="text-lg font-semibold text-text">{formatMoney(total)}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className="text-sm font-medium text-text hover:text-secondary transition"
                      >
                        {isExpanded ? 'Hide details' : 'View details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-neutral-200">
                      <h3 className="text-sm font-semibold text-text mb-4">Order items</h3>
                      {items.length === 0 ? (
                        <p className="text-sm text-secondary">No items found for this order.</p>
                      ) : (
                        <div className="space-y-4">
                          {items.map((item) => {
                            const itemPrice = item.item_price ?? item.product?.price ?? null;
                            const priceLabel = formatMoney(itemPrice);

                            return (
                              <div
                                key={item.id}
                                className="flex flex-col gap-4 sm:flex-row sm:items-center"
                              >
                                <ProductImage
                                  imageUrl={item.product?.image_url}
                                  alt={item.product?.name ?? 'Order item'}
                                  className="w-16 h-16 rounded-lg border border-neutral-200 object-cover"
                                  placeholderSize="small"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-text">
                                    {item.product?.name ?? 'Item'}
                                  </p>
                                  <p className="text-sm text-secondary">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-sm text-secondary">
                                  Item price: {priceLabel}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
