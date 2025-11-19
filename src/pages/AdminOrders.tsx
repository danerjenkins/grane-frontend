import { useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  item_price: number | null;
  product: {
    id: string;
    name: string;
    image_url: string;
    price: number;
    description: string;
  } | null;
}

interface Order {
  id: string;
  created_at: string;
  bake_days: { date: string } | null;
  customer_note: string | null;
  total_price: number | null;
  stripe_status: string | null;   // PAYMENT STATUS
  status: string | null;          // FULFILLMENT STATUS
  order_items: OrderItem[] | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // PATCH to mark order as completed
  const markAsCompleted = async (orderId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: 'completed' } : o
          )
        );
      }
    } catch (err) {
      console.error('Error marking completed:', err);
    }
  };

  // Fetch orders
  useEffect(() => {
    fetch('http://localhost:5000/api/orders')
      .then((res) => res.json())
      .then((data) => {
        console.log('ORDERS FROM API:', data);
        setOrders(data);
      })
      .catch((err) => console.error('Error loading orders:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Admin Orders</h1>

      {loading ? (
        <p className="text-gray-600 text-center">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600 text-center">No orders yet.</p>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-md border rounded-lg p-6"
            >
              {/* ---------------- HEADER ---------------- */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Order #{order.id.slice(0, 6)}
                </h2>

                {/* PAYMENT STATUS */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase text-gray-700">
                    Payment:
                  </span>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      order.stripe_status === 'paid'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {order.stripe_status ?? 'unknown'}
                  </span>
                </div>
              </div>

              {/* ---------------- FULFILLMENT STATUS ---------------- */}
              <div className="mt-3 mb-4 flex items-center space-x-2">
                <span className="text-xs font-bold uppercase text-gray-700">
                  Status:
                </span>

                {order.status !== 'completed' ? (
                  <button
                    onClick={() => markAsCompleted(order.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Mark Completed
                  </button>
                ) : (
                  <span className="text-green-700 font-semibold">
                    Completed ✔
                  </span>
                )}
              </div>

              {/* ---------------- BAKE DAY + TOTAL ---------------- */}
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Bake Day:</span>{' '}
                {order.bake_days?.date ?? 'Unknown'}
              </p>

              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Total:</span> $
                {order.total_price != null
                  ? (order.total_price / 100).toFixed(2)
                  : 'N/A'}
              </p>

              {/* ---------------- CUSTOMER NOTE ---------------- */}
              {order.customer_note && (
                <p className="text-sm text-gray-800 mt-3">
                  <span className="font-semibold">Note:</span>{' '}
                  {order.customer_note}
                </p>
              )}

              <hr className="my-4" />

              {/* ---------------- ORDERED ITEMS ---------------- */}
              <div className="space-y-3">
                {(order.order_items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 border-b pb-2"
                  >
                    {/* Product Image */}
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">
                        No Image
                      </div>
                    )}

                    {/* Product Info */}
                    <div>
                      <p className="font-medium">
                        {item.product?.name ?? 'Unknown Product'}
                      </p>

                      <p className="text-sm text-gray-600">
                        {item.quantity} × $
                        {item.item_price != null
                          ? (item.item_price).toFixed(2)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
