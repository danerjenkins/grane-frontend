import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

interface OrderItem {
  id: string;
  quantity: number;
  item_price: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  bake_days: { date: string } | null;
  total_price: number;
  customer_note: string | null;
  order_items: OrderItem[];
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const session_id = searchParams.get("session_id");

  useEffect(() => {
    if (!session_id) return;

    fetch(`http://localhost:5000/api/orders/by-session/${session_id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data))
      .catch((err) => console.error("Error loading order:", err))
      .finally(() => setLoading(false));
  }, [session_id]);

  if (!session_id) {
    return <p className="text-center mt-10">Session ID missing.</p>;
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      {loading ? (
        <p className="text-center text-gray-600">Loading your order...</p>
      ) : !order ? (
        <p className="text-center text-gray-600">Order not found.</p>
      ) : (
        <div className="max-w-xl mx-auto bg-white shadow-lg p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
            Thank You! 🎉
          </h1>

          <p className="text-center text-gray-700">
            Your order has been received and paid successfully.
          </p>

          <p className="text-center text-gray-500 text-sm mt-1">
            Order ID: {order.id.slice(0, 8)}
          </p>

          <hr className="my-6" />

          <h2 className="text-xl font-semibold mb-3">Order Summary</h2>

          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-16 h-16 rounded object-cover"
                />

                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} × ${(item.item_price / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-6" />

          <p className="text-lg">
            <span className="font-semibold">Total:</span>{" "}
            ${(order.total_price / 100).toFixed(2)}
          </p>

          {order.bake_days?.date && (
            <p className="mt-2 text-gray-700">
              <span className="font-semibold">Bake Day:</span>{" "}
              {new Date(order.bake_days.date).toLocaleDateString()}
            </p>
          )}

          {order.customer_note && (
            <p className="mt-3 text-gray-700">
              <span className="font-semibold">Your Note:</span>{" "}
              {order.customer_note}
            </p>
          )}

          <Link
            to="/"
            className="mt-8 block bg-black text-white py-3 text-center rounded-lg hover:bg-gray-800 transition"
          >
            Return Home
          </Link>
        </div>
      )}
    </main>
  );
}
